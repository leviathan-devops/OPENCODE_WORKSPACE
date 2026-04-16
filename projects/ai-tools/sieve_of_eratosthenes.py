from typing import List


def sieve_of_eratosthenes(limit: int) -> List[int]:
    """
    Find all prime numbers up to a given limit using the Sieve of Eratosthenes algorithm.

    Args:
        limit: The upper bound (inclusive) for finding prime numbers. Must be >= 0.

    Returns:
        A list of all prime numbers from 2 to limit (inclusive).

    Raises:
        TypeError: If limit is not an integer.
        ValueError: If limit is negative.

    Examples:
        >>> sieve_of_eratosthenes(10)
        [2, 3, 5, 7]

        >>> sieve_of_eratosthenes(30)
        [2, 3, 5, 7, 11, 13, 17, 19, 23, 29]

        >>> sieve_of_eratosthenes(1)
        []

        >>> sieve_of_eratosthenes(0)
        []

        >>> sieve_of_eratosthenes(2)
        [2]
    """
    if not isinstance(limit, int):
        raise TypeError(f"limit must be an integer, got {type(limit).__name__}")

    if limit < 0:
        raise ValueError(f"limit must be non-negative, got {limit}")

    if limit < 2:
        return []

    is_prime = [True] * (limit + 1)
    is_prime[0] = is_prime[1] = False

    for i in range(2, int(limit**0.5) + 1):
        if is_prime[i]:
            for j in range(i * i, limit + 1, i):
                is_prime[j] = False

    return [num for num in range(limit + 1) if is_prime[num]]


if __name__ == "__main__":
    import unittest
    import doctest

    class TestSieveOfEratosthenes(unittest.TestCase):
        def test_basic_cases(self):
            self.assertEqual(sieve_of_eratosthenes(10), [2, 3, 5, 7])
            self.assertEqual(
                sieve_of_eratosthenes(30), [2, 3, 5, 7, 11, 13, 17, 19, 23, 29]
            )

        def test_edge_cases(self):
            self.assertEqual(sieve_of_eratosthenes(0), [])
            self.assertEqual(sieve_of_eratosthenes(1), [])
            self.assertEqual(sieve_of_eratosthenes(2), [2])

        def test_small_primes(self):
            self.assertEqual(sieve_of_eratosthenes(3), [2, 3])
            self.assertEqual(sieve_of_eratosthenes(5), [2, 3, 5])
            self.assertEqual(sieve_of_eratosthenes(7), [2, 3, 5, 7])

        def test_single_prime(self):
            self.assertEqual(sieve_of_eratosthenes(4), [2, 3])

        def test_negative_limit(self):
            with self.assertRaises(ValueError):
                sieve_of_eratosthenes(-1)

        def test_large_limit(self):
            result = sieve_of_eratosthenes(100)
            self.assertEqual(len(result), 25)
            self.assertEqual(result[-1], 97)

        def test_empty_result(self):
            self.assertEqual(sieve_of_eratosthenes(1), [])

        def test_invalid_type(self):
            with self.assertRaises(TypeError):
                sieve_of_eratosthenes(10.5)
            with self.assertRaises(TypeError):
                sieve_of_eratosthenes("10")

    doctest.testmod()
    unittest.main()
