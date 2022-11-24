import React, { Component, useEffect, useState  } from 'react';
import Web3 from 'web3';
import './index.css';
import Meme from '../../abis/Meme.json'

import { useDispatch, useSelector } from 'react-redux';
import { connect } from 'react-redux';
import moment from 'moment';

import { verifyTokenAsync, userLogoutAsync } from "../../asyncActions/authAsyncActions";
import { userLogout, verifyTokenEnd } from "../../actions/authActions";

import { setAuthToken } from '../../services/auth';
import { getUserListService } from '../../services/user';

const ipfsClient = require('ipfs-http-client')
const ipfs = ipfsClient({host:'localhost',port:5001,protocol:'http'})

class Home extends Component {

  async componentDidMount(){
    
    await this.loadWeb3()
    await this.timer()
    await this.loadBlockchainData()
    // await this.getUserList()
    
  }

  // Get account
  // Get network
  // Get smartcontract
  //--->ABI
  //--->Address
  // Get Meme Hash
  
  async loadBlockchainData(){
    const web3 = window.web3
    const accounts = await web3.eth.getAccounts()
    this.setState({account: accounts[0]})
    const networkId = await web3.eth.net.getId()
    const networkData = Meme.networks[networkId]
    if(networkData){
      const abi = Meme.abi
      const address = networkData.address
      const contract = new web3.eth.Contract(abi, address)
      this.setState({contract})
      const memeHash = await contract.methods.get().call()
      this.setState({memeHash})
      console.log(contract)
    }else{
      window.alert('smartcontract not dployed...')
    }
  }

  constructor(props){
    super(props);
    this.state = {
      buffer: null,
      account: '',
      memeHash: '',
      userList: [],
    };
    // this.handleChange = this.handleChange.bind(this);
    // this.handleSubmit = this.handleSubmit.bind(this);
  }

  async loadWeb3(){
    if(window.ethereum){
      window.web3 = new Web3(window.ethereum)
    }if(window.web3){
      window.web3 = new Web3(window.web3.currentProvider)
    }else{
      window.alert('please use Metamask!')
    }
  }

  captureFile = (event) =>{
    event.preventDefault()
    //process IPFS
    const file = event.target.files[0]
    const reader = new window.FileReader()
    reader.readAsArrayBuffer(file)
    reader.onloadend = () => {
      this.setState({buffer:Buffer(reader.result)})
    }
    
  }

  onSubmit = (event)=>{
    event.preventDefault()
    console.log('Submitting the form...')
    ipfs.add(this.state.buffer, (error,result)=>{
      console.log('Ipfs result', result)
      const memeHash = result[0].hash
      if(error){
        console.error(error)
        return
      }
      this.state.contract.methods.set(memeHash).send({from: this.state.account}).then((r)=>{
        this.setState({memeHash})
      })
    })
  }

  // const dispatch = useDispatch();
  // const authObj = useSelector(state => state.auth);

  // const { user, token, expiredAt } = authObj;
  // const [userList, setUserList] = useState([]);

  // handle click event of the logout button
  // handleLogout = () => {
  //   this.props.userLogoutAsync();
  // }

  // // get user list
  // getUserList = async () => {
  //   const result = await getUserListService();
  //   if (result.error) {
  //     this.props.verifyTokenEnd();
  //     if (result.response && [401, 403].includes(result.response.status))
  //     this.props.userLogout();
  //     return;
  //   }
  //   this.setState({userList: result.data});
  // }

  // // set timer to renew token
  // async componentDidMount(){
    
  // }

  async timer(){
    const expiredAt = this.props.expiredAt;
    const token = this.props.token;
    setAuthToken(token);
    const verifyTokenTimer = setTimeout(() => {
      this.props.verifyTokenAsync(true);
    }, moment(expiredAt).diff() - 10 * 1000);
    return () => {
      clearTimeout(verifyTokenTimer);
    }
  }

  // // useEffect(() => {
  // //   setAuthToken(token);
  // //   const verifyTokenTimer = setTimeout(() => {
  // //     dispatch(verifyTokenAsync(true));
  // //   }, moment(expiredAt).diff() - 10 * 1000);
  // //   return () => {
  // //     clearTimeout(verifyTokenTimer);
  // //   }
  // // }, [expiredAt, token]);

  // // get user list on page load
  // componentDidMount(){
  //   this.getUserList();
  // }

  // componentDidUpdate(){
  //   this.getUserList();
  // }

  // useEffect(() => {
  //   getUserList();
  // }, []);

  render() {
    
    return (
      <div>
        <nav className="navbar navbar-dark fixed-top bg-dark flex-md-nowrap p-0 shadow">
          <a
            className="navbar-brand col-sm-3 col-md-2 mr-0"
            href="http://www.dappuniversity.com/bootcamp"
            target="_blank"
            rel="noopener noreferrer"
          >
            Meme of the Day
          </a>
          <ul className='navbar-nav px-3'>
            <li className='nav-item text-nowrap d-none d-sm-none d-sm-block'>
              <small className='text-white'>{this.state.account}</small>
            </li>
          </ul>
        </nav>
        <div className="container-fluid mt-5">
          <div className="row">
            <main role="main" className="col-lg-12 d-flex text-center">
              <div className="content mr-auto ml-auto">
                <a
                  href="http://www.dappuniversity.com/bootcamp"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img crossOrigin="anonymous" src={'http://127.0.0.1:8080/ipfs/'+this.state.memeHash} />
                </a>
                <p>&nbsp;</p>
                <h2>Change Meme</h2>
                <form onSubmit={this.onSubmit}>
                  <input type="file" onChange={this.captureFile}/>
                  <input type="submit"/>
                </form>
              </div>
            </main>
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  user: state.auth.user,
  token: state.auth.token,
  expiredAt: state.auth.expiredAt,
});

export default connect(mapStateToProps, {verifyTokenAsync, userLogoutAsync, userLogout, verifyTokenEnd })(Home);