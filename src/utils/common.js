//是否在股市操作时间
export const isOperation = () => {
    var today = new Date();

    var day = today.getDay();
    if (day == 0 || day == 6)
        return false;
    var hour = today.getHours();
    var minute = today.getMinutes();
    var time = hour * 100 + minute;
    if ((time > 920 && time < 1135) || (time > 1255 && time < 1505)) {
        return true;
    }

    return false;
}

