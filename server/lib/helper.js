function isJsonStr(str) {
  if (typeof str !== "string") return false;
  try {
    const result = JSON.parse(str);
    const type = Object.prototype.toString.call(result).toLowerCase();
    return type === "[object object]" || type === "[object array]";
  } catch (err) {
    return false;
  }
}

function isEmpty(str) {
  let string = typeof str === "string" ? str.replace(/\s/g, "") : str;
  string = typeof string === "number" ? string.toString() : string;
  string = isJsonObj(string) && Object.keys(string)?.length === 0 ? "" : string;
  string =
    isJsonStr(string) && Object.keys(JSON.parse(string))?.length === 0
      ? ""
      : string;
  return (
    typeof string === "undefined" ||
    !string ||
    string?.length === 0 ||
    string === "" ||
    string === "0000-00-00 00:00:00" ||
    string === null
  );
}

function formatErrorString(errorStr) {
  let resultErrorStr = "Empty Error";
  if (!isEmpty(errorStr)) {
    if (errorStr instanceof Array) {
      resultErrorStr = JSON.stringify(errorStr);
    } else {
      resultErrorStr = errorStr;
    }
  }
  return resultErrorStr;
}

function printErrorLog(logDetail) {
  if (showErrorLogs === true) {
    console.log(logDetail + "\n");
  }
}

module.exports = {
  isJsonStr,
  formatErrorString,
  printErrorLog,
};
