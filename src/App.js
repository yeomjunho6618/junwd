import React, {Component} from 'react';
import { observable } from 'mobx';
import {observer, inject } from 'mobx-react';
import logo from './logo.svg';
import './App.css';
import axios, {AxiosInstance} from 'axios';
import BigNumber from 'bignumber.js';
import _ from 'lodash';

const level = [
  {1: 20}, {2: 30}, {3: 50}, {4: 100}, {5: 250}, {6: 500}, {7: 1000}, {8: 2000}, {9: 4000}, {10: 8000},
];
const daumKey = 'd32eb3adc7a497f5249517f9cf976996',//다음 key
      {kakao} = window,
      httpService = axios.create({
        baseURL: 'https://8oi9s0nnth.apigw.ntruss.com/corona19-masks/v1/',
        headers:{
          'Content-Type': 'application/json;charset=UTF-8'
        }
      });

class App extends Component{
  constructor(props) {
      super(props);
  }

  state = {
    levelIndex: 4,//level index
    getCoordsType: false,//위치정보 동의
    coords: {lat: 37.5071359, lng: 127.0342994},//위치 37.5071359 127.0342994
    m: level[4],//거리(m)
    mapLoad: false,//kakao.maps.load 체크
    dataStoresByGeo: []//data storesByGeo
  }
  //@observable private dataStoresByGeo:[] = [];

  componentDidMount(){
    this.onGeolocation();//위치 요청
    this.ajaxStoresByGeo && this.ajaxStoresByGeo();//공공데이터 포털 api
    kakao.maps.load(this.onDaumMap);//daum map
  }

  ajaxStoresByGeo: AxiosInstance = () => {
    const {coords, m} = this.state;
    httpService.get('storesByGeo/json', {
      lat: coords.lat,
      lng: coords.lng,
      m: m
    }).then(res => {
      if(res.status === 200){
        this.setState({
          dataStoresByGeo: res.data.stores
        });
        
        this.state.mapLoad && this.onDaumMap();
      }else{
        alert('[api error] storesByGeo/json');
        console.error(res);
      }
    });
  };

  onDaumMap = () => {
    const {coords, dataStoresByGeo, mapLoad, levelIndex} = this.state;
    const container = document.getElementById('map'), //지도를 담을 영역의 DOM 레퍼런스
          options = { //지도를 생성할 때 필요한 기본 옵션
            center: new kakao.maps.LatLng(coords.lat, coords.lng), //지도의 중심좌표
            level: levelIndex//지도의 레벨(확대, 축소 정도)
          };
    
    const map = new kakao.maps.Map(container, options); //지도 생성 및 객체 리턴
    
    //map load
    if(!mapLoad){
      this.setState({
        mapLoad: true
      });

      map.relayout();
    }

    // 지도를 재설정할 범위정보를 가지고 있을 LatLngBounds 객체를 생성합니다
    const bounds = new kakao.maps.LatLngBounds(); 
    // 마커 이미지의 이미지 주소입니다
    const imageSrc = "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png"; 
    // 마커를 표시할 위치와 title 객체 배열입니다
    _.map(dataStoresByGeo, (a) => {
      // 마커를 생성합니다
      const marker = new kakao.maps.Marker({
          map: map, // 마커를 표시할 지도
          position: new kakao.maps.LatLng(a.lat, a.lng), // 마커를 표시할 위치
          title : a.name, // 마커의 타이틀, 마커에 마우스를 올리면 타이틀이 표시됩니다
          image : new kakao.maps.MarkerImage(
              imageSrc, new kakao.maps.Size(24, 35)
            ) // 마커 이미지 
      });

      marker.setMap(map);
      bounds.extend(new kakao.maps.LatLng(a.lat, a.lng));

      return {
        title: a.name,
        latlng: new kakao.maps.LatLng(a.lat, a.lng),
        //_: a
      };
    });
    
    // LatLngBounds 객체에 추가된 좌표들을 기준으로 지도의 범위를 재설정합니다
    // 이때 지도의 중심좌표와 레벨이 변경될 수 있습니다
    map.setBounds(bounds);
    kakao.maps.event.addListener(map, 'center_changed', function() {
      console.log('center changed!');
    });
  }

  onGeolocation = () => {
    /* 위치정보 사용 가능 */
    if('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        //console.log(position.coords.latitude,' | ', position.coords.longitude);
        this.setState({
          getCoordsType: true,
          coords: {
            lat : Number(new BigNumber(position.coords.latitude).toFixed(6)), 
            lng: Number(new BigNumber(position.coords.longitude).toFixed(6))
          }
        });
      });
    }
  }

  render(){
    const {coords, getCoordsType} = this.state;
    return (
      <article>
        {
          getCoordsType && 
          <section className="coords_info">
            <p>
              <span>위치 정보: </span>
              <span>lat:</span> <strong>{coords.lat}</strong>, <span>lng:</span> <strong>{coords.lng}</strong>
            </p>
          </section>
        }
        <section id="map" className="map_box"></section>
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
              <li>navigator.geolocation</li>
            </ol>

            <strong>관련 api 목록</strong><br/><br/>
            <ol>
              <li>공공데이터포털: https://www.data.go.kr/</li>
              <li>daum api: https://apis.map.kakao.com/web/documentation/</li>
            </ol>
          </section>
      </article>
    );
  }

}

export default App;