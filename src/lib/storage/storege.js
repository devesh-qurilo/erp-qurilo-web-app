const key ='auth'
export function setStorage(data){
    localStorage.setItem(key,JSON.stringify(data))
}
export function getStorage(){
    if(localStorage.getItem(key)){
        return JSON.parse(localStorage.getItem(key))
    }
}
export function clearStorage(){
    localStorage.removeItem(key)
}