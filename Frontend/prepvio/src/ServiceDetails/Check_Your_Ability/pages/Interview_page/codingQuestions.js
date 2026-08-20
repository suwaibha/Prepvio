// codingQuestions.js
// Deterministic coding question bank for interview coding rounds

export const codingQuestions = [
  {
    id: 1,
    title: "Reverse an Array",
    companies: ["Microsoft", "Infosys", "TCS"],
    description: "Reverse the given array without using built-in reverse functions.",
    functionName: "reverseArray",
    params: "arr",
    testCases: [
      { input: "[1,2,3,4]", expected: "[4,3,2,1]" },
      { input: "[5,6]", expected: "[6,5]" }
    ]
  },

  {
    id: 2,
    title: "Find Largest Element in an Array",
    companies: ["Amazon", "Wipro"],
    description: "Find the largest element in the given array.",
    functionName: "findLargest",
    params: "arr",
    testCases: [
      { input: "[1,5,3]", expected: "5" },
      { input: "[10,2,8]", expected: "10" }
    ]
  },

  {
    id: 3,
    title: "Find Smallest Element in an Array",
    companies: ["Accenture", "Cognizant"],
    description: "Find the smallest element in the given array.",
    functionName: "findSmallest",
    params: "arr",
    testCases: [
      { input: "[4,2,9]", expected: "2" },
      { input: "[7,1,6]", expected: "1" }
    ]
  },

  {
    id: 4,
    title: "Sum of First N Natural Numbers",
    companies: ["TCS", "Infosys"],
    description: "Calculate the sum of first N natural numbers.",
    functionName: "sumNaturalNumbers",
    params: "n",
    testCases: [
      { input: "5", expected: "15" },
      { input: "10", expected: "55" }
    ]
  },

  {
    id: 5,
    title: "Print Fibonacci Series up to N",
    companies: ["Tech Mahindra", "Infosys"],
    description: "Print Fibonacci series up to N terms.",
    functionName: "fibonacci",
    params: "n",
    testCases: [
      { input: "5", expected: "[0,1,1,2,3]" },
      { input: "7", expected: "[0,1,1,2,3,5,8]" }
    ]
  },

  {
    id: 6,
    title: "Check Palindrome Number",
    companies: ["HCL", "Cognizant"],
    description: "Check whether a given number is a palindrome.",
    functionName: "isPalindromeNumber",
    params: "n",
    testCases: [
      { input: "121", expected: "true" },
      { input: "123", expected: "false" }
    ]
  },

  {
    id: 7,
    title: "Check Palindrome String",
    companies: ["TCS", "Accenture"],
    description: "Check whether a given string is a palindrome.",
    functionName: "isPalindromeString",
    params: "str",
    testCases: [
      { input: "\"madam\"", expected: "true" },
      { input: "\"hello\"", expected: "false" }
    ]
  },

  {
    id: 8,
    title: "Find ASCII Value of a Character",
    companies: ["Cognizant", "Wipro"],
    description: "Find the ASCII value of the given character.",
    functionName: "asciiValue",
    params: "ch",
    testCases: [
      { input: "\"A\"", expected: "65" },
      { input: "\"a\"", expected: "97" }
    ]
  },

  {
    id: 9,
    title: "Count Vowels and Consonants",
    companies: ["Capgemini", "HCL"],
    description: "Count the number of vowels and consonants in a string.",
    functionName: "countVowelsConsonants",
    params: "str",
    testCases: [
      { input: "\"hello\"", expected: "{vowels:2, consonants:3}" },
      { input: "\"aeiou\"", expected: "{vowels:5, consonants:0}" }
    ]
  },

  {
    id: 10,
    title: "Remove Duplicates from an Array",
    companies: ["Amazon", "Google"],
    description: "Remove duplicate elements from the array.",
    functionName: "removeDuplicates",
    params: "arr",
    testCases: [
      { input: "[1,2,2,3]", expected: "[1,2,3]" },
      { input: "[5,5,5]", expected: "[5]" }
    ]
  },

  {
    id: 11,
    title: "Sum of Digits of a Number",
    companies: ["Tech Mahindra", "Infosys"],
    description: "Calculate the sum of digits of a given number.",
    functionName: "sumOfDigits",
    params: "n",
    testCases: [
      { input: "123", expected: "6" },
      { input: "405", expected: "9" }
    ]
  },

  {
    id: 12,
    title: "Check Armstrong Number",
    companies: ["TCS", "HCL"],
    description: "Check whether a given number is an Armstrong number.",
    functionName: "isArmstrong",
    params: "n",
    testCases: [
      { input: "153", expected: "true" },
      { input: "123", expected: "false" }
    ]
  },

  {
    id: 13,
    title: "Sort Array without Built-in Functions",
    companies: ["Infosys", "Wipro"],
    description: "Sort the array in ascending order without using built-in sort.",
    functionName: "sortArray",
    params: "arr",
    testCases: [
      { input: "[3,1,2]", expected: "[1,2,3]" },
      { input: "[5,4,1]", expected: "[1,4,5]" }
    ]
  },

  {
    id: 14,
    title: "Convert Lowercase to Uppercase",
    companies: ["Tech Mahindra", "TCS"],
    description: "Convert all lowercase characters in a string to uppercase.",
    functionName: "toUpperCaseString",
    params: "str",
    testCases: [
      { input: "\"hello\"", expected: "\"HELLO\"" },
      { input: "\"Java\"", expected: "\"JAVA\"" }
    ]
  },

  {
    id: 15,
    title: "Check Anagrams",
    companies: ["Flipkart", "Amazon"],
    description: "Check whether two strings are anagrams.",
    functionName: "areAnagrams",
    params: "str1, str2",
    testCases: [
      { input: "\"listen\",\"silent\"", expected: "true" },
      { input: "\"hello\",\"world\"", expected: "false" }
    ]
  },

  {
    id: 16,
    title: "Find Missing Number from 1 to N",
    companies: ["Microsoft", "Adobe"],
    description: "Find the missing number in the range 1 to N.",
    functionName: "findMissingNumber",
    params: "arr, n",
    testCases: [
      { input: "[1,2,4,5],5", expected: "3" },
      { input: "[2,3,1,5],5", expected: "4" }
    ]
  },

  {
    id: 17,
    title: "Move All Zeros to End",
    companies: ["Google", "Amazon"],
    description: "Move all zeros in the array to the end without changing order.",
    functionName: "moveZeros",
    params: "arr",
    testCases: [
      { input: "[0,1,0,3,12]", expected: "[1,3,12,0,0]" },
      { input: "[0,0,1]", expected: "[1,0,0]" }
    ]
  },

  {
    id: 18,
    title: "Factorial Using Recursion",
    companies: ["Wipro", "TCS"],
    description: "Find factorial of a number using recursion.",
    functionName: "factorial",
    params: "n",
    testCases: [
      { input: "5", expected: "120" },
      { input: "3", expected: "6" }
    ]
  },

  {
    id: 19,
    title: "Print Prime Numbers in a Range",
    companies: ["Accenture", "Tech Mahindra"],
    description: "Print all prime numbers between 1 and N.",
    functionName: "printPrimes",
    params: "n",
    testCases: [
      { input: "10", expected: "[2,3,5,7]" },
      { input: "20", expected: "[2,3,5,7,11,13,17,19]" }
    ]
  },

  {
    id: 20,
    title: "Maximum of Two Numbers Without If",
    companies: ["Infosys", "Wipro"],
    description: "Find the maximum of two numbers without using if-else.",
    functionName: "maxWithoutIf",
    params: "a, b",
    testCases: [
      { input: "5,10", expected: "10" },
      { input: "7,3", expected: "7" }
    ]
  }
];