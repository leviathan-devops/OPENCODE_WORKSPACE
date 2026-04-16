import unittest
from sieve_of_eratosthenes import sieve_of_eratosthenes


class TestSieveOfEratosthenes(unittest.TestCase):
    def test_small_primes(self):
        self.assertEqual(sieve_of_eratosthenes(10), [2, 3, 5, 7])

    def test_limit_inclusive(self):
        self.assertEqual(
            sieve_of_eratosthenes(30), [2, 3, 5, 7, 11, 13, 17, 19, 23, 29]
        )

    def test_prime_as_limit(self):
        self.assertEqual(sieve_of_eratosthenes(13), [2, 3, 5, 7, 11, 13])

    def test_zero(self):
        self.assertEqual(sieve_of_eratosthenes(0), [])

    def test_one(self):
        self.assertEqual(sieve_of_eratosthenes(1), [])

    def test_two(self):
        self.assertEqual(sieve_of_eratosthenes(2), [2])

    def test_three(self):
        self.assertEqual(sieve_of_eratosthenes(3), [2, 3])

    def test_negative_limit(self):
        with self.assertRaises(ValueError):
            sieve_of_eratosthenes(-1)

    def test_negative_large(self):
        with self.assertRaises(ValueError):
            sieve_of_eratosthenes(-100)

    def test_float_limit(self):
        with self.assertRaises(TypeError):
            sieve_of_eratosthenes(10.5)

    def test_string_limit(self):
        with self.assertRaises(TypeError):
            sieve_of_eratosthenes("10")

    def test_none_limit(self):
        with self.assertRaises(TypeError):
            sieve_of_eratosthenes(None)

    def test_list_limit(self):
        with self.assertRaises(TypeError):
            sieve_of_eratosthenes([10])

    def test_large_limit(self):
        primes = sieve_of_eratosthenes(100)
        expected_first_25_primes = [
            2,
            3,
            5,
            7,
            11,
            13,
            17,
            19,
            23,
            29,
            31,
            37,
            41,
            43,
            47,
            53,
            59,
            61,
            67,
            71,
            73,
            79,
            83,
            89,
            97,
        ]
        self.assertEqual(primes, expected_first_25_primes)

    def test_very_large_limit(self):
        primes = sieve_of_eratosthenes(1000)
        self.assertEqual(len(primes), 168)
        self.assertEqual(primes[0], 2)
        self.assertEqual(primes[-1], 997)


if __name__ == "__main__":
    unittest.main()
