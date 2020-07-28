// https://developer.chrome.com/extensions/xhr

chrome.runtime.onMessage.addListener(async (request, sender) => {
    console.log('got member data', request)
    const memberData = request;

    for(let member of memberData){
        try {
            [member.timeout, member.code] =  await getGistInfo(member)
        } catch(error) {
            alert(error)
            console.error('error occured on getting data from gist page')
            return
        }
    }

    let report = ''

    for(let member of memberData){
        let URL = `https://gist.github.com/${member.githubID}/${member.gistID}`
        report += `${member.memberID} ${member.timeout} ${URL}\n`
        chrome.downloads.download({
            saveAs: false,
            url: member.code,
            filename: `${memberID}.${member.code.split('.').slice(-1)}`
        })
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
    // To prevent attack, create URL instantly
    const URL = `https://gist.github.com/${member.githubID}/${member.gistID}`
    fetch(URL)
        .then(response => response.text())
        .then(text => {
            console.log('Get data from gist', URL, text)
            let time = getLastTime(text)
            let code = getCode(text)
            resolve([isTimeout(time), code])
        })
        .catch(error => {
            reject(error)
        })

})

const getLastTime = (html) => {

}

const isTimeout = (time) => {

}

const getCode = (html) => {

}