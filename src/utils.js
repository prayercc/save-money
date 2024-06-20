export const getImageUrl = (path,iconName,iconType) => {
    return new URL(`../assets/img/${path}/${iconName}.${iconType}`, import.meta.url).href
    // return new URL(`../../../assets/img/account/${icon}.svg`, import.meta.url).href
}