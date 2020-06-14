import React, {Component} from 'react';
import { observable } from 'mobx';
import {observer, inject } from 'mobx-react';
import logo from './logo.svg';
import './App.css';
import axios, {AxiosInstance} from 'axios';
import BigNumber from 'bignumber.js';
import _ from 'lodash';

const {kakao} = window;
class App extends Component{
  level = [
    {1: 500}, {2: 500}, {3: 500}, {4: 500}, {5: 500}, {6: 500}, {7: 1000}, {8: 2000}, {9: 4000}, {10: 8000},
  ];
  daumKey = 'd32eb3adc7a497f5249517f9cf976996';//다음 key  
  baseURL = 'https://8oi9s0nnth.apigw.ntruss.com/corona19-masks/v1/';
  // httpService = axios.create({
  //   baseURL: 'https://8oi9s0nnth.apigw.ntruss.com/corona19-masks/v1/',
  //   headers:{
  //     'Content-Type': 'application/json;charset=UTF-8'
  //   }
  // });
  $imgTmap = '//w.namu.la/s/0e9adfef1211ea11dca7ab2289b8024f31ca5ad764b1026c4291a4c6b4294a85a698faf7f23ace7c0ed62cde2eb073f5d1e251bfe93ee91e5a5e2e27e5db9086939f3388ec9aa4911f1ce8c3f994609e5cdace9e143d628a765225a8126f0aa54811e66b3dbc95651c80272f99162641';
  $imgKakao = '//developers.kakao.com/assets/img/about/logos/kakaolink/kakaolink_btn_small.png';
  $clickedOverlay = null;//customLayer

  constructor(props) {
      super(props);
  }

  state = {
    first: 0,//처음map load
    levelIndex: 4,//level index
    getCoordsType: false,//위치정보 동의
    coords: {lat: 37.568152222181695, lng: 127.07024730966333},//위치 37.5071359 127.0342994
    m: this.level[4][5],//거리(m)
    mapLoad: false,//kakao.maps.load 체크
    dataStoresByGeo: []//data storesByGeo
  }
  //@observable private dataStoresByGeo:[] = [];
  
  componentDidMount(){
    this.onGeolocation();//위치 요청
    this.ajaxStoresByGeo && this.ajaxStoresByGeo();//공공데이터 포털 api
    kakao.maps.load(this.onDaumMap);//daum map
    window.Kakao && window.Kakao.init('0d459b6028e864dbdd008b5d7701a2b5');//kakao link
    window.fnKakaoLink = (_text) =>{
      if(!window.Kakao) return;
      window.Kakao.Link.sendCustom({
        templateId: 30265,
        templateArgs: {
          title: 'junwd',
          description: _text
        }
      })
    };
  }

  //ajax api
  ajaxStoresByGeo = () => {
    const {coords, m} = this.state;
    axios.get(`${this.baseURL}storesByGeo/json`, {params:{
      lat: coords.lat,
      lng: coords.lng,
      m: m
    }}).then(res => {
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

  //map에 데이터 그리기
  onDaumMap = () => {
    const {coords, dataStoresByGeo, mapLoad, levelIndex} = this.state;
    if(!dataStoresByGeo) return;
    
    const container = document.getElementById('map'), //지도를 담을 영역의 DOM 레퍼런스
          options = { //지도를 생성할 때 필요한 기본 옵션
            center: new kakao.maps.LatLng(coords.lat, coords.lng), //지도의 중심좌표
            level: levelIndex//지도의 레벨(확대, 축소 정도)
          },
          map = new kakao.maps.Map(container, options); //지도 생성 및 객체 리턴
    
    //map load
    if(!mapLoad){
      this.setState({
        mapLoad: true
      });

      map.relayout();
    }

    // 지도를 재설정할 범위정보를 가지고 있을 LatLngBounds 객체를 생성합니다
    const bounds = new kakao.maps.LatLngBounds(); 
    const mapData = this.fnDateChange(dataStoresByGeo),
          // 인포윈도우를 표시하는 클로저를 만드는 함수입니다 
          makeOverListener = (_map, _marker, _customOverlay) =>{
            if (this.$clickedOverlay) {
              this.$clickedOverlay.setMap(null);
            } 
            _customOverlay.setMap(_map);
            this.$clickedOverlay = _customOverlay;
          };
    const overlays = [],//설명레이어s
          markers = [];//마커s

    //데이터 만큼 marker, layer push
    mapData.map((item, i)=>{
      //마커 push
      const itemMarker = new kakao.maps.Marker({
        map: map, // 마커를 표시할 지도
        position: item.latlng // 마커의 위치
      });
      markers.push(itemMarker);

      //설명레이어 push
      overlays.push(new kakao.maps.CustomOverlay({
        map: map,
        position: itemMarker.getPosition(),
        content: item.content,
        clickable: true,
        yAnchor: 1 
      }));
      // // 마커에 mouseover 이벤트와 mouseout 이벤트를 등록합니다
      // // 이벤트 리스너로는 클로저를 만들어 등록합니다 
      // // for문에서 클로저를 만들어 주지 않으면 마지막 마 커에만 이벤트가 등록됩니다
      
       kakao.maps.event.addListener(markers[i], 'click', () => {
         makeOverListener(map, markers[i], overlays[i])
       });
       overlays[i].setMap(null);//레이어 팝업 닫기
       bounds.extend(new kakao.maps.LatLng(item.position[0], item.position[1]));
    });
    
    // LatLngBounds 객체에 추가된 좌표들을 기준으로 지도의 범위를 재설정합니다
    // 이때 지도의 중심좌표와 레벨이 변경될 수 있습니다
    const {first} = this.state;
    if(first < 2){
      map.setBounds(bounds);
      this.setState({
        first: first + 1
      });
    }    

    //위치 이동시 setTime으로 체크후 위치 가져와서 다시 로드
    let fnSetTimeGeo;
    const that = this;
    kakao.maps.event.addListener(map, 'center_changed', function() {
      clearTimeout(fnSetTimeGeo);
      fnSetTimeGeo = setTimeout(() => {
        const mapCenter = map.getCenter(),
              {coords} = that.state;

        //resize 하면 NaN으로 넘어와서 조건 추가
        //기존 값이랑 같으면 안바꿔요
        if(
          isNaN(mapCenter.Ha) || isNaN(mapCenter.Ga) ||
          (coords.lat === mapCenter.Ha && coords.lng === mapCenter.Ga)
        ) return;
        

        let mapLevel = map.getLevel();
        if(mapLevel > 10) mapLevel = 9;
        that.setState({
           levelIndex: mapLevel,
           m: that.level[mapLevel][mapLevel+1],
           coords: {lat: mapCenter.Ha, lng: mapCenter.Ga}
        });
        that.ajaxStoresByGeo();
      }, 10);
    });
  }

  //공공데이터 map데이터로 가공
  fnDateChange = (_data) => {
    return  _.map(_data, (item) => {
      const tmapLink = `https://apis.openapi.sk.com/tmap/app/routes?appKey=l7xx9de2b46db2d24ae58a619d1efc1c23e5&name=${item.name}&lon=${item.lng}&lat=${item.lat}`;
      
      return {
        content: `<div class="customoverlay"><dl><dt>${item.name}</a></dt>` +
                  `<dd><p><strong>주소: </strong>${item.addr}</p>`+ (item.stock_at !== null ? `<p><strong>stock_at: </strong>${item.stock_at}</p>` : '') + `</dd>` +
                  `<dd>`+
                  
      
                  `<a href="${tmapLink}" target="_blank" title="t맵"><img src="${this.$imgTmap}" width="20px" /> Tmap</a>`+
                  `<a href="javascript:window.fnKakaoLink('${item.name} : ${item.addr}')" title="카카오링크"><img src="${this.$imgKakao}" width="20px" /> Kakao Link</a>`+
                  `</dd></dl></div>`,
        latlng: new kakao.maps.LatLng(item.lat, item.lng),
        position: [item.lat, item.lng]
      }
    }, []);
  }
  
  /* 위치정보 사용 가능 */
  onGeolocation = () => {
    if('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        this.setState({
          getCoordsType: true,
          coords: {
            lat : Number(new BigNumber(position.coords.latitude).toFixed(6)), 
            lng: Number(new BigNumber(position.coords.longitude).toFixed(6))
          }
        });
        this.ajaxStoresByGeo();
      });
    }
  }

  render(){
    const {coords, getCoordsType} = this.state;
    return (
      <article>
        <section id="map" className="map_box"></section>
        {
          getCoordsType && 
          <section className="coords_info">
            <p>
              <span>위치 정보: </span>
              <span>lat:</span> <strong>{coords.lat}</strong>, <span>lng:</span> <strong>{coords.lng}</strong>
            </p>
          </section>
        }
        {/*
        <section className={'install_list'}>
            <strong>install 목록</strong><br/>
            <ol className={'list'}>
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
            <br/><br/>

            <strong>관련 api 목록</strong><br/>
            <ol className={'list'}>
              <li>공공데이터포털: https://www.data.go.kr/</li>
              <li>daum api: https://apis.map.kakao.com/web/documentation/</li>
            </ol>
          </section>
        */}
      </article>
    );
  }
}

export default App;