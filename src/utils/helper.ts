
export const ObjectToString = (obj: Object) => {
   return Object.values(obj).reduce((prev, next) => {
        if(next !== null) {
          return prev.toString() + next.toString();
        }
        return prev.toString();
      });
}
export const dateFormat = (hourString: string) : string => {
  return hourString.slice(0, 2).padStart(2, '0') + "h" + hourString.slice(2, 4);
}
