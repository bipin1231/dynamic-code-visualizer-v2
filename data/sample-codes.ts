export const sampleCodes = {
  fibonacci: `function fibonacci(n) {
  if (n <= 1) {
    return n;
  }
  let a = 0;
  let b = 1;
  for (let i = 2; i <= n; i++) {
    let temp = a + b;
    a = b;
    b = temp;
  }
  return b;
}

console.log("Fibonacci of 5:", fibonacci(5));
console.log("Fibonacci of 10:", fibonacci(10));`,

  bubbleSort: `function bubbleSort(arr) {
  const n = arr.length;
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        // Swap elements
        let temp = arr[j];
        arr[j] = arr[j + 1];
        arr[j + 1] = temp;
      }
    }
  }
  return arr;
}

const numbers = [64, 34, 25, 12, 22, 11, 90];
console.log("Original array:", numbers);
console.log("Sorted array:", bubbleSort([...numbers]));`,

  factorial: `function factorial(n) {
  if (n === 0 || n === 1) {
    return 1;
  }
  return n * factorial(n - 1);
}

function iterativeFactorial(n) {
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
}

console.log("Recursive factorial of 5:", factorial(5));
console.log("Iterative factorial of 5:", iterativeFactorial(5));`,

  binarySearch: `function binarySearch(arr, target) {
  let left = 0;
  let right = arr.length - 1;
  
  while (left <= right) {
    let mid = Math.floor((left + right) / 2);
    
    if (arr[mid] === target) {
      return mid;
    } else if (arr[mid] < target) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }
  
  return -1;
}

const sortedArray = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
console.log("Array:", sortedArray);
console.log("Search for 7:", binarySearch(sortedArray, 7));
console.log("Search for 4:", binarySearch(sortedArray, 4));`,
}
