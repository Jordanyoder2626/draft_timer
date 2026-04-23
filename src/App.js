import bml from './BML_LOGO.png';
import bmldraft from './bmldraft.png';
import './App.css';
import * as React from 'react';
import { useState, useEffect } from 'react';
import chime from './nfl-draft-chime.mp3';
import nfl from './nfl-theme-song.mp3';
import countdown from './countdown.mp3';
import Modal from './Modal';

import dak from './logos/dak.jpg'
import dirk from './logos/dirk.jpg'
import gustavo from './logos/gustavo.svg'
import hurts from './logos/hurts.png'
import lamario from './logos/lamario.jpg'
import leighton from './logos/leighton.jpg'
import pen from './logos/pen.jpg'
import phoenix from './logos/phoenix.jpg'
import warrior from './logos/warrior.svg'
import fants from './logos/levis.png'
import jordan from './logos/jordan.png'
import fw from './logos/firewheel.png'
import imp from './logos/imp.png'
import dh from './logos/dh.png'





function App(){
  const tpp = 90 ;
  const [seconds, setSeconds] = useState(tpp);
  const [isActive, setIsActive] = useState(false);
  const [pick, setPick] = useState(1);
  const [round, setRound] = useState(1);
  const [isOdd, setIsOdd] = useState(true);
  const [pIn, setPIn] = useState(false);
  const [isOpen, setIsOpen] = useState(false);


  const [inProgress, setInProgress] = React.useState(false);
  const [move, setMove] = React.useState(true);
  const [spot, setSpot] = React.useState(1);
  const cd = new Audio(countdown);
  


  useEffect(() => {
      const keyDownHandler = event => {
        console.log(event);
        if(event.key === 'Enter' && !inProgress){
          event.preventDefault();
          startDraft();
        }

        if(event.key === 'Escape' && inProgress){
          event.preventDefault();
          setIsOpen(true);
        }

        if (event.key === ' ') {
          event.preventDefault();

          if(inProgress && !pIn){
            toggle();
          }
          if(inProgress && pIn && seconds !==0){
            setMove(false);
            reset();
          }
          if(seconds===0){
            setMove(false);
            reset();
          }
        }
      };

      document.addEventListener('keydown', keyDownHandler);

      return () => {
        document.removeEventListener('keydown', keyDownHandler);
      };
    }, [inProgress, isActive, pIn, seconds, move]);


  useEffect(() => {
    let interval = null;
    setSpot(Math.abs(-11*(round%2) + 11 - pick)-1);
    
    if (isActive) {
      interval = setInterval(() => {
        if(seconds < 150){
          setMove(true);
        }
        if(pIn){
          cd.pause();
          setMove(false);
        }
        if(seconds===12){
          cd.play();
        }

        if(seconds > 0){
        setSeconds(seconds => seconds - 1);
        }else{
          setMove(false);
          setPIn(true);
          sound();
          setIsActive(false);
        }
      }, 1000);
    } else if (!isActive && seconds !== 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, seconds, move, pIn, spot, round, pick, setSpot]);

  function increasePick(){
    
    if(pick>9 && round>15){
      return;
    }
    if(pick>9){
      setPick(1);
      setRound(round +1);
      if(isOdd){
        setIsOdd(false);
      }else{
        setIsOdd(true);
      }
    }
    else{
      setPick(pick+1)
    }
  }


  function decreasePick(){
    if(round === 1 && pick === 1){
      return;
    }
    if(pick === 1){
      setPick(10);
      setRound(round - 1);
      if(isOdd){
        setIsOdd(false);
      }else{
        setIsOdd(true);
      }
    }else{
      setPick(pick-1);
    }
  }


  function toggle() {
    if(isActive){ 
      sound();
      setPIn(true);
      setMove(false);
    }
    setIsActive(!isActive);
  }

  function reset() {
    
    increasePick()
    setPIn(false);
    setSeconds(tpp);
    setIsActive(true);
  }
  
  const nflAudio = new Audio(nfl);
  const startDraft = () => {
    
    setInProgress(true);
    nflAudio.play();

  }

  const backOne = (event) => {
    setPIn(false);
    setSeconds(tpp);
    setIsActive(true);
    decreasePick();
  }

  const exit = (event) => {
    setIsActive(false);
    setInProgress(false);
  }

  function sound(){
    new Audio(chime).play();
  }

  function Team(name, logo, finish, ending, record) {
    this.name = name;
    this.logo = logo;
    this.finish = finish;
    this.ending = ending;
    this.record = record;
  }
  const la = new Team("Kitty's Reign", leighton, 5, "th", "34-53-1");
  const cs = new Team("Lamario", lamario, 2, "nd", "51-37");
  const cy = new Team("Man", pen, 6, "th", "46-42");
  const lb = new Team("Mighty Acorns", dirk, 7, "th", "45-43");
  const jy = new Team("The Warriors", warrior, 3, "rd", "55-33");
  const qm = new Team("The Champ", dak, 1, "st", "37-51");
  const cb = new Team("Gustavo's Revenge", gustavo, 9, "th", "47-41");
  const tw = new Team("Xazavian", hurts, 8, "th", "36-52");
  const rm = new Team("Gruden Grinders", fants, "Last", "", "44-44");
  const ld = new Team("Droupymagic", phoenix, 4, "th", "44-43-1" )


  const order = [la, qm, lb, cs, cy, jy, ld, tw, rm, cb];
  


  return (
    <div>
      {!inProgress ?(
        <div className="App">
          <header className="App-header">
          < p className='welcome'>
          Welcome to the 2025-2026 BML Draft
            </p>
            <div className='App-logo-wrapper'style={{ '--mask-url': `url(${bmldraft})` }}>
              <img src={bmldraft} className="App-logo" alt="logo" />
              <div className='shimmer-overlay'></div>
            </div>
            
            <p className='year'>
              YEAR 8
              <div className = 'Sponsors'>
              <p className='sponsors-text'>Thank You to our Sponsors:</p>
                <div className='sponsors-logos'>
                  <img src={imp}  />
                  <img src={dh}  />
                  <img src={fw} />
                  <img src={jordan} />
                </div>
              </div>
            </p>
            
            {/*<button className="button" onClick={startDraft} style={{width: '20vw', height: '10vh', fontSize: '25px'}}>Start Draft</button>
            */}          
          </header>
          
        </div>
      ):(
        <div className = "timer">
          
          <header className = "timer-header" style={{backgroundColor: pIn ? 'black':null}}>
          
          {/*<button className='button' onClick={setIsOpen(true)}>Exit Draft</button>*/}
          {/*isOpen ? <Modal setIsOpen={setIsOpen}/> : null*/}
          
            <div className='words'  style={{opacity: pIn ? 0: 100}} >
              <h1 className='onC'>On the Clock: {order[spot].name}</h1>
            </div>
            
            
            <img src={order[spot].logo} className='circle' alt={bml} style={{scale: pIn ? '1.75': '1'}} />
            <img src={order[round%2===1? spot+1 - Math.floor(pick/10):spot-1 + Math.floor(pick/10)].logo} className='next' alt={bml} style={{opacity: pIn ? 0 : 100}}/>
            <img src={bml} className='next-bml' alt={bml} style={{opacity: pIn ? 0 : 100}}/>


            <div className='tt-finish' style={{opacity: pIn ? 0 : 100}}>
              <div className = 'tt-finish-font'>2024 Finish:</div>
              <div className='tt-finish-place'>{order[spot].finish}{order[spot].ending}</div>
            </div>

            <div className='tt-record' style={{opacity: pIn ? 0 : 100}}>
              <div className = 'tt-finish-font'>Career Record:</div>
              <div className='tt-finish-place'>{order[spot].record}</div>
            </div>

            <div className='next-words' style={{opacity: pIn ? 0 : 100}}>Next Pick:</div>
            <h1 className= "pick-words" style={{
              opacity: !pIn ? 0: 100, 
              transitionDelay: !pIn? '0ms':'3000ms', 
              transitionDuration: !pIn?'1000ms': '3000ms',
              left: move?'0px':null}}>The Pick is In...</h1>
            <div className = "time-group" style={{opacity: pIn ? 0: 100}}>
                <h2 className='time' >{Math.floor(seconds/60)}:{seconds%60<10? 0 : ""}{seconds-(Math.floor(seconds/60)*60)}</h2>
                <button className="button" onClick={backOne}>
                  Previous Pick
                </button>
                <button className={`button button-primary button-primary-${isActive ? 'active' : 'inactive'}`} onClick={toggle}>
                  {isActive ? 'Pick Is In' : 'Start'}
                </button>
                <button className="button" onClick={reset}>
                  Next Pick
                </button>
                <h1 className='round'>Round: {round}, Pick: {pick}</h1>
            </div>
          </header>
        </div>
      )}
    </div>
  
  
  
  
  
  
  );
}

export default App;
