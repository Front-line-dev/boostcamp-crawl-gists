const MEMBER_KEY = '5ff197ed552d672a6ce77648052586f3c0492fd5846b300a6f786fbdef74fa66'

const getMemberList = () => new Promise(resolve => {
    chrome.storage.sync.get([MEMBER_KEY], (result) =>{
        // If not initialized
        if (!result.hasOwnProperty(MEMBER_KEY)){
            setMemberList([])
            // return([])
            resolve([])
            return
        }

        const memberList = result[MEMBER_KEY]
        console.log('members list', memberList)
        // return memberList
        resolve(memberList)
        return
    })
})

const setMemberList = (memberList) => {
    let dict = {}
    dict[MEMBER_KEY] = memberList
    chrome.storage.sync.set(dict, function() {
        console.log('members set to', memberList);
    })
    refreshMemberList(memberList)
}

const addMember = async () => {
    const inputBox = document.getElementById('id-input')
    const memberID = inputBox.value
    inputBox.value = ''

    // If user input is valid
    if (memberID) {
        const memberList = await getMemberList()
        memberList.push(memberID)
        setMemberList(memberList)
    }
}

const deleteMembers = () => {
    setMemberList([])
    console.log('Deleted all members')
    refreshMemberList([])
}

const refreshMemberList = (memberList) => {
    const ul = document.getElementById('member-list')
    ul.innerText = ''   // Erase list

    console.log('refresh', memberList)

    for (let member of memberList){
        let li = document.createElement('li')
        li.innerText = member
        ul.appendChild(li)
    }
}

const crawlGists = async () => {
    const memberList = await getMemberList()
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        console.log('send member list to script.js')
        console.log(memberList)
        console.log(tabs)
        chrome.tabs.sendMessage(tabs[0].id, memberList)
    })
}

window.onload = async () => {
    // Add Event listener
    document.getElementById('crawl').addEventListener('click', crawlGists)
    document.getElementById('add-member').addEventListener('click', addMember)
    document.getElementById('delete-members').addEventListener('click', deleteMembers)

    const memberList = await getMemberList()
    console.log('window load', memberList)
    refreshMemberList(memberList)
}