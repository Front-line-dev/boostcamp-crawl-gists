// https://developer.chrome.com/extensions/xhr

// Recieved Message from script.js
chrome.runtime.onMessage.addListener(async (request, sender) => {
    console.log('got member data', request)
    let {day, members} = request


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

    let report = ''

    for(let member of members){
        if (member.exist){
            const URL = `https://gist.githubusercontent.com${member.code}`
            const fileExt = member.code.split('.').slice(-1)[0]
            console.log(fileExt)
            report += `${member.memberID} ${member.timeout} ${getGistURL(member)}\n`
            chrome.downloads.download({
                saveAs: false,
                url: URL,
                filename: validate_filename(`${member.memberID}.${fileExt}`)
            })
        } else {
            // Member is not in list
            report += `${member.memberID} COULD NOT BE FOUND\n`
        }


        
    }

    chrome.downloads.download({
        saveAs: false,
        url: createURLBlob(report),
        filename: 'report.txt'
    })

})

const createURLBlob = (report) => {
    const blob = new Blob([report], {type: "text/plain"})
    return URL.createObjectURL(blob)
}

const validate_filename = (name) => {
    //replace | * ? \ : < > $
    var new_name = name.replace(/\||\*|\?|\\|\:|\<|\>|\$/gi, function (x) {
        return ''
    })

    return new_name
}



const getGistInfo = (member) => new Promise((resolve, reject) => {
    const URL = getGistURL(member)
    fetch(URL)
        .then(response => response.text())
        .then(text => {
            console.log('Get data from gist', URL)
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
    const URL = `https://gist.github.com/${member.githubID}/${member.gistID}`
    return URL
}

const parseHTML = (html) => {
    const domparser = new DOMParser()
    const doc = domparser.parseFromString(html, 'text/html')
    // gist uses jQuery time-ago tag. Cannot read with pure js
    const datetime = doc.getElementsByTagName('time-ago')[0].getAttribute('datetime')
    const date = new Date(datetime)
    const buttonDivs = doc.getElementsByClassName('file-actions')
    return [date.toLocaleString(), getCode(buttonDivs)]
}

const getCode = (buttonDivs) => {
    let codes = []
    for(let buttonDiv of buttonDivs){
        buttonDiv.firstElementChild.getAttribute('href')
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