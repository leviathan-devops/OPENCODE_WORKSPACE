# Task: Implement a Lock-Free MPSC Bounded Channel in Rust

Write the complete implementation in a single file: `mpsc_lockfree.rs`

## Struct Definition (use exactly this)

```rust
use std::cell::UnsafeCell;
use std::sync::atomic::{AtomicUsize, Ordering};
use std::mem::MaybeUninit;

const CAPACITY: usize = 1024;

pub struct Sender<T> {
    inner: *const Inner<T>,
}

pub struct Receiver<T> {
    inner: *const Inner<T>,
}

struct Inner<T> {
    buffer: Box<[UnsafeCell<MaybeUninit<T>>]>,
    head: AtomicUsize,      // consumer (receiver) reads this
    tail: AtomicUsize,      // producers write this
    closed: AtomicUsize,    // 0 = open, 1 = closed
}

unsafe impl<T: Send> Send for Sender<T> {}
unsafe impl<T: Send> Send for Receiver<T> {}
unsafe impl<T: Send> Sync for Inner<T> {}
```

## Channel Creation

Implement:
```rust
pub fn channel<T>() -> (Sender<T>, Receiver<T>)
```

Steps:
1. Create `Inner` with buffer of size `CAPACITY`, each slot initialized via `MaybeUninit::uninit()`
2. Set `head = 0`, `tail = 0`, `closed = 0`
3. Wrap in `Box`, then get raw pointer via `Box::into_raw`
4. Create `Sender { inner }` and `Receiver { inner }`
5. Return both

## Drop Implementations

For `Sender::drop`:
1. Access inner via unsafe dereference
2. If this is the last sender (track with Arc or just drop - for simplicity, drop does nothing special)

For `Receiver::drop`:
1. Read all remaining slots and call `MaybeUninit::assume_init_drop()` on them
2. Then drop the Inner box

For simplicity, use `Arc<Inner<T>>` instead of raw pointers. This simplifies drop logic.

**Revised struct (use this instead):**

```rust
use std::sync::Arc;
use std::cell::UnsafeCell;
use std::sync::atomic::{AtomicUsize, Ordering};
use std::mem::MaybeUninit;

const CAPACITY: usize = 1024;

pub struct Sender<T> {
    inner: Arc<Inner<T>>,
}

pub struct Receiver<T> {
    inner: Arc<Inner<T>>,
}

struct Inner<T> {
    buffer: Box<[UnsafeCell<MaybeUninit<T>>]>,
    head: AtomicUsize,      // consumer reads: next slot to read
    tail: AtomicUsize,      // producers write: next slot to write
    closed: AtomicUsize,    // 0 = open, 1 = closed
    sender_count: AtomicUsize,  // track senders for close detection
}
```

## send() Method

Implement on `Sender<T>`:
```rust
impl<T> Sender<T> {
    pub fn send(&self, value: T) -> Result<(), SendError<T>> {
        // Step 1: Loop until we reserve a slot
        // Step 2: Use tail.fetch_add(1, Ordering::AcqRel) to reserve
        // Step 3: Calculate index = reserved_tail % CAPACITY
        // Step 4: Write value: unsafe { (*self.inner.buffer[index].get()).write(value); }
        // Step 5: Return Ok(())
        
        // If closed: return Err(SendError(value))
        
        // Bounded check: if reserved_tail - head >= CAPACITY, we're full
        // In that case, spin-wait (yield) until head advances
        // Load head with Ordering::Acquire
    }
}

pub struct SendError<T>(pub T);
```

Algorithm for send():
```
loop {
    // Check if closed
    if self.inner.closed.load(Ordering::Acquire) == 1 {
        return Err(SendError(value));
    }
    
    let tail = self.inner.tail.load(Ordering::Acquire);
    let head = self.inner.head.load(Ordering::Acquire);
    
    if tail - head >= CAPACITY {
        // Buffer full, spin
        std::thread::yield_now();
        continue;
    }
    
    // Try to claim this slot
    match self.inner.tail.compare_exchange_weak(
        tail, tail + 1, Ordering::AcqRel, Ordering::Acquire
    ) {
        Ok(reserved) => {
            let idx = reserved % CAPACITY;
            unsafe {
                (*self.inner.buffer[idx].get()).as_mut_ptr().write(value);
            }
            return Ok(());
        }
        Err(_) => continue, // someone else modified tail, retry
    }
}
```

## recv() Method

Implement on `Receiver<T>`:
```rust
impl<T> Receiver<T> {
    pub fn recv(&self) -> Result<T, RecvError> {
        // Step 1: Loop until we claim a slot
        // Step 2: Load head and tail with Acquire ordering
        // Step 3: If head == tail AND closed == 1, return Err(RecvError)
        // Step 4: If head == tail AND closed == 0, spin-yield and retry
        // Step 5: Try head.compare_exchange_weak(head, head+1, AcqRel, Acquire)
        // Step 6: On success, read from buffer[head % CAPACITY]
        // Step 7: Call maybe_uninit.assume_init_read() to get value
        // Step 8: Return Ok(value)
    }
    
    pub fn try_recv(&self) -> Result<T, TryRecvError> {
        // Same as recv but return TryRecvError::Empty instead of spinning
    }
}

#[derive(Debug)]
pub struct RecvError;

#[derive(Debug)]
pub enum TryRecvError {
    Empty,
    Disconnected,
}
```

Algorithm for recv():
```
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
        head, head + 1, Ordering::AcqRel, Ordering::Acquire
    ) {
        Ok(old_head) => {
            let idx = old_head % CAPACITY;
            let value = unsafe {
                (*self.inner.buffer[idx].get()).assume_init_read()
            };
            return Ok(value);
        }
        Err(_) => continue,
    }
}
```

## close() Method

Implement on Sender:
```rust
impl<T> Sender<T> {
    pub fn close(&self) {
        self.inner.closed.store(1, Ordering::Release);
    }
}

impl<T> Drop for Sender<T> {
    fn drop(&mut self) {
        // Decrement sender_count
        let prev = self.inner.sender_count.fetch_sub(1, Ordering::AcqRel);
        if prev == 1 {
            // Last sender dropped, close the channel
            self.inner.closed.store(1, Ordering::Release);
        }
    }
}
```

## is_closed() Method

```rust
impl<T> Sender<T> {
    pub fn is_closed(&self) -> bool {
        self.inner.closed.load(Ordering::Acquire) == 1
    }
}
```

## Tests (copy exactly, fill in `channel()` call)

```rust
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
                        // Encode: producer_id * 100000 + seq_num
                        tx.send(id * 100_000 + i).unwrap();
                    }
                })
            })
            .collect();

        for h in handles {
            h.join().unwrap();
        }
        drop(tx); // last sender drops, closes channel

        let mut received = Vec::new();
        while let Ok(msg) = rx.recv() {
            received.push(msg);
        }

        assert_eq!(received.len(), num_producers * msgs_per_producer);

        // Verify no duplicates and all values present
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
        // Fill the channel
        for i in 0..CAPACITY {
            tx.send(i).unwrap();
        }
        // Channel is now full - sender should not panic, just block
        // We test this by sending from another thread
        let tx2 = Sender { inner: Arc::clone(&tx.inner) };
        let handle = thread::spawn(move || {
            tx2.send(999).unwrap(); // This should block until receiver drains
        });

        // Drain half the channel
        for _ in 0..CAPACITY / 2 {
            rx.recv().unwrap();
        }

        // Now the blocked sender should unblock
        handle.join().unwrap();
        tx.close();

        let remaining: Vec<_> = std::iter::from_fn(|| rx.recv().ok()).collect();
        assert_eq!(remaining.len(), CAPACITY / 2 + 1);
    }

    #[test]
    fn test_close_wakes_receiver() {
        let (tx, rx) = channel::<()>();
        let handle = thread::spawn(move || {
            rx.recv().unwrap_err(); // Should return Err when closed
        });

        thread::sleep(std::time::Duration::from_millis(50));
        tx.close();
        handle.join().unwrap();
    }

    #[test]
    fn test_drop_sender_closes_channel() {
        let (tx, rx) = channel::<String>();
        tx.send("hello".to_string()).unwrap();
        drop(tx); // Drop sender, should close channel

        let msg = rx.recv().unwrap();
        assert_eq!(msg, "hello");
        assert!(rx.recv().is_err());
    }
}
```

## Final Requirements

1. Do NOT use `Mutex`, `Condvar`, or any blocking lock primitives
2. Do NOT use `std::sync::mpsc` - implement from scratch
3. The ONLY blocking operation allowed is `std::thread::yield_now()` for spin-waiting
4. All shared state access must use atomic operations
5. All buffer access must use `UnsafeCell` with proper synchronization
6. The code must compile with `rustc --edition 2021`
7. All 5 tests must pass with `cargo test`

Write the complete file to `/home/leviathan/mpsc_lockfree.rs`
