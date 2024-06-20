import localforage from "localforage";
const store = localforage.createInstance({
    name: "keephouse"
});

export default store