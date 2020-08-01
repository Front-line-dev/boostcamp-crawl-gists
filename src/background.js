// https://developer.chrome.com/extensions/xhr
// Chrome extension guide strongly recommand safe fetch code
// Whoever modifying this code, Read this document first.

// Recieved Message from script.js
chrome.runtime.onMessage.addListener((request, sender) => {
    console.log('got member data', request)
    let {day, members} = request

    processGist(day, members)
    // Message recieved -> processGist -> processDownload
})

const processGist = async (day, members) => {
    for(let member of members){
        // Member is not in list
        if (!member.exist)
            continue

        try {
            [member.timeout, member.codes] =  await getGistInfo(member)
        } catch(error) {
            alert(error)
            console.error('error occured on getting data from gist page')
            return
        }
    }
    console.log(members)

    processDownload(day, members)
}

const processDownload = async (day, members) => {
    let report = ''
    let zip = new JSZip()

    for(let member of members){
        if (!member.exist){
            report += `${member.memberID} COULD NOT BE FOUND\n`
            continue
        }

        let memberFolder = zip.folder(member.memberID)

        for(let gistFileID of member.codes){
            let blob = await downloadFile(gistFileID)
            console.log(blob)
            memberFolder.file(gistFileID.split('/').splice(-1)[0], blob)
        }

        report += `${member.memberID} ${member.timeout} ${getGistURL(member)}\n`
    }

    zip.file('report.txt', new Blob([report], {type: "text/plain"}))
    let file = await zip.generateAsync({type:"blob"})

    chrome.downloads.download({
        saveAs: false,
        url: URL.createObjectURL(file),
        filename: `${day}.zip`
    })
}

const downloadFile = (gistFileID) => new Promise((resolve, reject) => {
    const url = `https://gist.githubusercontent.com${gistFileID}`

    fetch(url)
        .then(response => {
            const blob = response.blob()
            resolve(blob)
        })
        .catch(error => {
            reject(error)
        })
})

const validate_filename = (name) => {
    //replace | * ? \ : < > $
    var new_name = name.replace(/\||\*|\?|\\|\:|\<|\>|\$/gi, function (x) {
        return ''
    })

    return new_name
}



const getGistInfo = (member) => new Promise((resolve, reject) => {
    const url = getGistURL(member)
    fetch(url)
        .then(response => response.text())
        .then(text => {
            console.log('Get data from gist', url)
            // console.log(text)
            let time, codes;
            [time, codes] = parseHTML(text)
            resolve([time, codes])
        })
        .catch(error => {
            reject(error)
        })

})

const getGistURL = (member) => {
    // To prevent malicious attack, create URL with fixed domain
    const url = `https://gist.github.com/${member.githubID}/${member.gistID}`
    return url
}

// Parse gist html
// Get [last-edited-time, files(urls)] 
const parseHTML = (html) => {
    const domparser = new DOMParser()
    const doc = domparser.parseFromString(html, 'text/html')
    // gist uses jQuery time-ago tag. Cannot read with pure js
    const datetime = doc.getElementsByTagName('time-ago')[0].getAttribute('datetime')
    const date = new Date(datetime)
    const buttonDivs = doc.getElementsByClassName('file-actions')
    return [date.toLocaleString(), getCode(buttonDivs)]
}

// Get code url from 'RAW' button DOM object
const getCode = (buttonDivs) => {
    let codes = []
    for(let buttonDiv of buttonDivs){
        codes.push(buttonDiv.firstElementChild.getAttribute('href'))
    }

    return codes
}

// Deprecated
const getTimeString = (date) => {
    const current = new Date()
    const late = '마지막 시간이 7시를 넘었습니다. 확인이 필요합니다'
    const attend = '7시 이전에 제출 했습니다'

    // If the submission date is equal to today
    if (current.getDay() === date.getDay()){
        return late
    }

    // If the submission hour is over 19
    if (date.getHours() >= 19){
        return late
    }

    return attend
}