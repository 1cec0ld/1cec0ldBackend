

const User = {
  login: (req, res)=> {
    console.log('User.login', req.body)
    res.status(200).send({token: 'fragglerock', user: {name: 'User.Name', permission: 'admin'}})
  },
  blank: (req, res)=> {
    res.status(200).send({user: null, error: 'Post Only'})
  },
}


export default User