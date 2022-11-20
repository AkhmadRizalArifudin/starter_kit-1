import React, { Component } from 'react';
import Web3 from 'web3';
import './index.css';
import Meme from '../../abis/Meme.json'

const ipfsClient = require('ipfs-http-client')
const ipfs = ipfsClient({host:'localhost',port:5001,protocol:'http'})

class Home extends Component {

  async componentWillMount(){
    await this.loadWeb3()
    await this.loadBlockchainData()
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
                  <img src={'http://127.0.0.1:8080/ipfs/'+this.state.memeHash} />
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

export default Home;