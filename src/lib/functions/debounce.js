
import Api from "$lib/api/api";

let updateTimer;
function save(url, payload, action = null) {
    clearTimeout(updateTimer);
    updateTimer = setTimeout(async () => {
        const response = await Api.put(url+ '.json', payload);
        // let response = await Api.get("/abstractions/"+abstraction.id+".json")
        console.log('response', response);
    }, 1000);
}

export default save;
