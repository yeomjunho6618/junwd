import React from 'react';
import logo from './logo.svg';
import './App.css';
import axios, {AxiosInstance} from 'axios';

const API = axios.create({
  baseURL: 'https://8oi9s0nnth.apigw.ntruss.com/corona19-masks/v1/',
  headers:{
    'Content-Type': 'application/json;charset=UTF-8'
  }
});

function App() {
  const ajaxStoresByGeo: AxiosInstance = () => {
    console.log('[ajaxStoresByGeo]');
    API.get('storesByGeo/json', {
      lat: '37.5010881',
      lng: '127.0342169',
      m: '5000'
    }).then(res => {
      console.log(res);
    });
  };

  return (
    <div className="App" onClick={()=>{
      ajaxStoresByGeo && ajaxStoresByGeo();
    }}>
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React<br/><br/>
        </a>
      </header>
      <section style={{textAlign: 'left'}}>
          <strong>install 목록</strong><br/><br/>
          <ol>
            <li>axios => ajax</li>
            <li>mox</li>
            <li>mobx-decorators</li>
            <li>mobx-react</li>
            <li>react-transition-group // 고려만animation</li>
            <li>typescript</li>
            <li>lodash</li>
            <li>bignumber.js </li>  
          </ol>
        </section>
    </div>
  );
}

export default App;
