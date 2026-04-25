const time = Date.now().toString();
const day = new Date(Date.now()).getDay().toString();
const date = new Date(Date.now()).toLocaleDateString().toString();
const month = new Date(Date.now()).getMonth().toString();
const year = new Date(Date.now()).getFullYear().toString;
const fullDate = day + date + month + year 


console.log(fullDate);
