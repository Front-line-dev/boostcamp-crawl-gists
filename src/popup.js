// To prevent hacking from other apps, use random string
const MEMBER_KEY = '5ff197ed552d672a6ce77648052586f3c0492fd5846b300a6f786fbdef74fa66'

// Accessing chrome sync storage is call-back method
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

//  Read string from input-box and add it to member list
const addMember = async () => {
    const inputBox = document.getElementById('input-box')
    const memberID = inputBox.value
    inputBox.value = ''

    // If user input is valid
    if (memberID) {
        const memberList = await getMemberList()
        memberList.push(memberID)
        memberList.sort();
        setMemberList(memberList)
    }
}

const deleteMembers = () => {
    setMemberList([])
    console.log('Deleted all members')
    refreshMemberList([])
}

//  Rerender member list on popup page
const refreshMemberList = (memberList) => {
    const ul = document.getElementById('member-list')
    ul.innerText = ''   // Erase list

    console.log('refresh', memberList)

    // If members are exist
    for (let member of memberList){
        addList(member)
    }

    // No members
    if (memberList.length === 0){
        addList('Please add members')
    }
}

const addList = (text) => {
    const ul = document.getElementById('member-list')
    const strong = document.createElement('strong')
    ul.appendChild(strong)
    const li = document.createElement('li')
    strong.appendChild(li)
    li.innerText = text
}

// Send message to current open tab to start crawling
const crawlGists = async () => {
    const memberList = await getMemberList()
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        console.log('send member list to script.js')
        console.log(memberList)
        console.log(tabs)
        chrome.tabs.sendMessage(tabs[0].id, memberList)
    })
    const crawlButton = document.getElementById('crawl')
    crawlButton.disabled = true
    crawlButton.style.backgroundColor = 'grey'
    crawlButton.style.cursor = 'auto'
    crawlButton.innerText = 'Downloading...'
}

// Since chrome extension cannot declare functions on html page, add event listener
window.onload = async () => {
    // Add Event listener
    document.getElementById('crawl').addEventListener('click', crawlGists)
    document.getElementById('add-member').addEventListener('click', addMember)
    document.getElementById('delete-members').addEventListener('click', deleteMembers)
    document.getElementById('input-box').addEventListener("keydown", ({key}) => {
        if (key === "Enter") {
            event.preventDefault();
            addMember()
        }
    })

    // Show registered members
    const memberList = await getMemberList()
    console.log('window load', memberList)
    refreshMemberList(memberList)
}

