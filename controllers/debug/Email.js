import axios from 'axios'
//Using axios because most recent version of npm-postmark depends on vulnerable axios packages.
//Why not cut out the middle man?

const headerObject = {
  headers: {
    'Accept': "application/json",
    "Content-Type": "application/json",
    "X-Postmark-Server-Token": process.env.EMAIL_API_TOKEN
  }
}
const bodyObject = {
  'From': 'ereq-server-alerts@mdlabs.com',
  'Subject': 'Ereq API Issue',
  'MessageStream': 'outbound'
}
const axiosInstance = axios.create({
  baseURL: 'https://api.postmarkapp.com/email'
})


const send = (htmlBody, email_to = process.env.EMAIL_DEBUG_GROUP) => {
  bodyObject['HtmlBody'] = htmlBody
  bodyObject['To'] = email_to
  
  axiosInstance
    .post('', bodyObject, headerObject)
    .then(resp => {
      console.log(resp)
    })
    .catch(err => {
      console.log(err)
    })
    .finally(() => {
      console.log("Postmark email finish")
    })
}

const Email = (req, res) => {
  send("You've got an email")
  res.status(204).send()
}

export default Email;