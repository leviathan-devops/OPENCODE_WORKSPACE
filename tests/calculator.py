def add(x, y):
    return x + y


def subtract(x, y):
    return x - y


def multiply(x, y):
    return x * y


def divide(x, y):
    try:
        return x / y
    except ZeroDivisionError:
        return "Error: Division by zero is not allowed"


def get_number(prompt):
    while True:
        try:
            number = float(input(prompt))
            return number
        except ValueError:
            print("Invalid input. Please enter a valid number.")


def display_menu():
    print("\nSimple Calculator")
    print("================")
    print("1. Addition (+)")
    print("2. Subtraction (-)")
    print("3. Multiplication (*)")
    print("4. Division (/)")
    print("5. Exit")
    print("================")


def calculator():
    print("Welcome to the Simple Calculator!")

    while True:
        display_menu()

        choice = input("Enter your choice (1-5): ")

        if choice == "5":
            print("Thank you for using the calculator. Goodbye!")
            break

        if choice in ["1", "2", "3", "4"]:
            num1 = get_number("Enter first number: ")
            num2 = get_number("Enter second number: ")

            if choice == "1":
                result = add(num1, num2)
                print(f"Result: {num1} + {num2} = {result}")
            elif choice == "2":
                result = subtract(num1, num2)
                print(f"Result: {num1} - {num2} = {result}")
            elif choice == "3":
                result = multiply(num1, num2)
                print(f"Result: {num1} * {num2} = {result}")
            elif choice == "4":
                result = divide(num1, num2)
                if isinstance(result, str):
                    print(result)
                else:
                    print(f"Result: {num1} / {num2} = {result}")
        else:
            print("Invalid choice. Please enter a number between 1 and 5.")


if __name__ == "__main__":
    calculator()
