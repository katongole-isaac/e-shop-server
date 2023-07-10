
/**
 * Validate form input in the reset-password template
 * @returns boolean
 */
function validate() {
  const passwordRegExp = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;

  let newPassword = document.forms[0]["newPassword"].value;
  let confirmPassword = document.forms[0]["confirmPassword"].value;

  const errorMsgBox_1 = document.querySelector(
    "form > div:nth-of-type(1) small"
  );
  const errorMsgBox_2 = document.querySelector(
    "form > div:nth-of-type(2) small"
  );

  const errors = {};

  if (!passwordRegExp.test(newPassword.trim())) {
    errorMsgBox_1.innerHTML =
      "Password must atleast be of length 6 char(s) madeup of char(s), digit(s)";
    return false;
  } else {
    errorMsgBox_1.innerHTML = "";
  }

  if (!(!!confirmPassword.trim() && confirmPassword === newPassword)) {
    errorMsgBox_2.innerHTML = "Passwords don't match";
    return false;
  } else {
    errorMsgBox_2.innerHTML = "";
  }

  return true
}
