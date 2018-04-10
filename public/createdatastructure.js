var x = 1,
    a = [];

for (; x < 32; x++) {
  let obj = {};
  obj["day"] = x;
  if (x.toString().length < 2) {
    obj["value"] = "0" + x.toString()
  } else {
    obj["value"] = x.toString();
  }
  a.push(obj);
}


console.log(a);