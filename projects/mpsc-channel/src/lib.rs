use std::cell::UnsafeCell;
use std::mem::MaybeUninit;
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::Arc;
use std::thread;

const CAPACITY: usize = 1024;

pub struct Sender<T> {
    inner: Arc<Inner<T>>,
}

pub struct Receiver<T> {
    inner: Arc<Inner<T>>,
}

struct Inner<T> {
    buffer: Box<[UnsafeCell<MaybeUninit<T>>]>,
    head: AtomicUsize,
    tail: AtomicUsize,
    closed: AtomicUsize,
    sender_count: AtomicUsize,
}

unsafe impl<T: Send> Send for Sender<T> {}
unsafe impl<T: Send> Send for Receiver<T> {}
unsafe impl<T: Send> Sync for Inner<T> {}

pub fn channel<T>() -> (Sender<T>, Receiver<T>) {
    let buffer: Vec<UnsafeCell<MaybeUninit<T>>> = (0..CAPACITY)
        .map(|_| UnsafeCell::new(MaybeUninit::uninit()))
        .collect();
    let inner = Arc::new(Inner {
        buffer: buffer.into_boxed_slice(),
        head: AtomicUsize::new(0),
        tail: AtomicUsize::new(0),
        closed: AtomicUsize::new(0),
        sender_count: AtomicUsize::new(1),
    });
    (
        Sender {
            inner: Arc::clone(&inner),
        },
        Receiver { inner },
    )
}

impl<T> Sender<T> {
    pub fn close(&self) {
        self.inner.closed.store(1, Ordering::Release);
    }

    pub fn is_closed(&self) -> bool {
        self.inner.closed.load(Ordering::Acquire) == 1
    }

    pub fn send(&self, value: T) -> Result<(), SendError<T>> {
        loop {
            if self.inner.closed.load(Ordering::Acquire) == 1 {
                return Err(SendError(value));
            }
            let tail = self.inner.tail.load(Ordering::Acquire);
            let head = self.inner.head.load(Ordering::Acquire);
            if tail - head >= CAPACITY {
                std::thread::yield_now();
                continue;
            }
            match self.inner.tail.compare_exchange_weak(
                tail,
                tail + 1,
                Ordering::AcqRel,
                Ordering::Acquire,
            ) {
                Ok(reserved) => {
                    let idx = reserved % CAPACITY;
                    unsafe {
                        (*self.inner.buffer[idx].get()).as_mut_ptr().write(value);
                    }
                    return Ok(());
                }
                Err(_) => continue,
            }
        }
    }
}

#[derive(Debug)]
pub struct SendError<T>(pub T);

impl<T> Drop for Sender<T> {
    fn drop(&mut self) {
        let prev = self.inner.sender_count.fetch_sub(1, Ordering::AcqRel);
        if prev == 1 {
            self.inner.closed.store(1, Ordering::Release);
        }
    }
}

impl<T> Receiver<T> {
    pub fn recv(&self) -> Result<T, RecvError> {
        loop {
            let head = self.inner.head.load(Ordering::Acquire);
            let tail = self.inner.tail.load(Ordering::Acquire);
            let closed = self.inner.closed.load(Ordering::Acquire);
            if head == tail {
                if closed == 1 {
                    return Err(RecvError);
                }
                std::thread::yield_now();
                continue;
            }
            match self.inner.head.compare_exchange_weak(
                head,
                head + 1,
                Ordering::AcqRel,
                Ordering::Acquire,
            ) {
                Ok(old_head) => {
                    let idx = old_head % CAPACITY;
                    let value = unsafe { (*self.inner.buffer[idx].get()).assume_init_read() };
                    return Ok(value);
                }
                Err(_) => continue,
            }
        }
    }

    pub fn try_recv(&self) -> Result<T, TryRecvError> {
        let head = self.inner.head.load(Ordering::Acquire);
        let tail = self.inner.tail.load(Ordering::Acquire);
        let closed = self.inner.closed.load(Ordering::Acquire);
        if head == tail {
            if closed == 1 {
                return Err(TryRecvError::Disconnected);
            }
            return Err(TryRecvError::Empty);
        }
        let idx = head % CAPACITY;
        let value = unsafe { (*self.inner.buffer[idx].get()).assume_init_read() };
        Ok(value)
    }
}

#[derive(Debug)]
pub struct RecvError;

#[derive(Debug)]
pub enum TryRecvError {
    Empty,
    Disconnected,
}

impl<T> Receiver<T> {
    pub fn is_closed(&self) -> bool {
        self.inner.closed.load(Ordering::Acquire) == 1
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::Arc;
    use std::thread;

    #[test]
    fn test_single_producer_single_consumer() {
        let (tx, rx) = channel();
        tx.send(42).unwrap();
        tx.close();
        assert_eq!(rx.recv().unwrap(), 42);
        assert!(rx.recv().is_err());
    }

    #[test]
    fn test_multiple_producers() {
        let (tx, rx) = channel::<usize>();
        let tx = Arc::new(tx);
        let num_producers = 8;
        let msgs_per_producer = 10_000;

        let handles: Vec<_> = (0..num_producers)
            .map(|id| {
                let tx = Arc::clone(&tx);
                thread::spawn(move || {
                    for i in 0..msgs_per_producer {
                        tx.send(id * 100_000 + i).unwrap();
                    }
                })
            })
            .collect();

        for h in handles {
            h.join().unwrap();
        }
        drop(tx);

        let mut received = Vec::new();
        while let Ok(msg) = rx.recv() {
            received.push(msg);
        }

        assert_eq!(received.len(), num_producers * msgs_per_producer);

        received.sort();
        for producer in 0..num_producers {
            for seq in 0..msgs_per_producer {
                let expected = producer * 100_000 + seq;
                assert_eq!(
                    received.binary_search(&expected).unwrap(),
                    expected,
                    "Missing message {}",
                    expected
                );
            }
        }
    }

    #[test]
    fn test_bounded_blocks_then_succeeds() {
        let (tx, rx) = channel::<u32>();
        for i in 0..CAPACITY {
            tx.send(i as u32).unwrap();
        }
        let tx2 = Sender {
            inner: Arc::clone(&tx.inner),
        };
        let handle = thread::spawn(move || {
            tx2.send(999).unwrap();
        });

        for _ in 0..CAPACITY / 2 {
            rx.recv().unwrap();
        }

        handle.join().unwrap();
        tx.close();

        let remaining: Vec<_> = std::iter::from_fn(|| rx.recv().ok()).collect();
        assert_eq!(remaining.len(), CAPACITY / 2 + 1);
    }

    #[test]
    fn test_close_wakes_receiver() {
        let (tx, rx) = channel::<()>();
        let handle = thread::spawn(move || {
            rx.recv().unwrap_err();
        });

        thread::sleep(std::time::Duration::from_millis(50));
        tx.close();
        handle.join().unwrap();
    }

    #[test]
    fn test_drop_sender_closes_channel() {
        let (tx, rx) = channel::<String>();
        tx.send("hello".to_string()).unwrap();
        drop(tx);

        let msg = rx.recv().unwrap();
        assert_eq!(msg, "hello");
        assert!(rx.recv().is_err());
    }
}
