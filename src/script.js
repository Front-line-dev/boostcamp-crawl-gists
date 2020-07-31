chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('got member list', request)
    const memberList = request
    const gistTable = createGistTable()
    const memberData = []
    
    for (let member of memberList){
        let data = {
            'memberID': member,
            'githubID': null,
            'gistID': null,
            'timeout': null,
            'codes': null,
            'exist': null
        };

        [data.exist, data.githubID, data.gistID] = getGistAddr(member, gistTable)
        memberData.push(data)
    }

    console.log('send to background.js', memberData)
    chrome.runtime.sendMessage({
        'day': getDay(),
        'members': memberData
    })
})

const createGistTable = () => {
    const trs = document.getElementsByTagName('tr')
    const gistTable = {}

    for(let tr of trs){
        // Skip Table title
        if (tr.firstElementChild.tagName === 'TH')
            continue

        let memberID = tr.firstChild.firstChild.innerText
        let gistURL = tr.lastChild.firstChild.innerText
        let githubID, gistID;
        [githubID, gistID] = gistURL.split('/').slice(-2)

        gistTable[memberID] = {
            'githubID': githubID,
            'gistID': gistID
        }

    }

    return gistTable
}

const getGistAddr = (memberID, gistTable) => {
    // If memberID is not in list
    if (!(memberID in gistTable)){
        return [false, null, null]
    }

    const githubID = gistTable[memberID].githubID
    const gistID = gistTable[memberID].gistID
    return [true, githubID, gistID]
}

const getDay = () => {
    return document.getElementsByTagName('h1')[1].innerText
}