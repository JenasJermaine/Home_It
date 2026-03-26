const regex = new RegExp("^\\+254[71]\\d{8}$");
console.log(regex.test("0708838460")); // true
console.log(regex.test("+254108838463")); // false (space not allowed)