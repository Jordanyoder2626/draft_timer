import bml from './BML_LOGO.png';
import bmldraft from './bmldraft.png';
import './App.css';
import * as React from 'react';
import { useState, useEffect } from 'react';
import chime from './nfl-draft-chime.mp3';
import nfl from './nfl-theme-song.mp3';

import dak from './logos/dak.jpg'
import dirk from './logos/dirk.jpg'
import gustavo from './logos/gustavo.jpg'
import hurts from './logos/hurts.jpg'
import lamario from './logos/lamario.jpg'
import leighton from './logos/leighton.jpg'
import peen from './logos/peen.png'
import phoenix from './logos/phoenix.jpg'
import warrior from './logos/warrior.jpg'
import fants from './logos/fants.jpg'





function App(){
  const [seconds, setSeconds] = useState(120);
  const [isActive, setIsActive] = useState(false);
  const [pick, setPick] = useState(1);
  const [round, setRound] = useState(1);
  const [isOdd, setIsOdd] = useState(true);
  const [pIn, setPIn] = useState(false);


  const [inProgress, setInProgress] = React.useState(false);
  const [move, setMove] = React.useState(true);
  const [spot, setSpot] = React.useState(1);



  useEffect(() => {
      const keyDownHandler = event => {
        if(event.key === 'Enter' && !inProgress){
          event.preventDefault();
          startDraft();
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
    }, [inProgress, isActive, pIn, seconds, move, toggle, reset]);


  useEffect(() => {
    let interval = null;
    setSpot(Math.abs(-11*(round%2) + 11 - pick)-1);
    if (isActive) {
      interval = setInterval(() => {
        if(seconds < 150){
          setMove(true);
        }
        if(pIn){
          setMove(false);
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
    setSeconds(120);
    setIsActive(true);
  }

  const startDraft = () => {
    
    setInProgress(true);
    new Audio(nfl).play();

  }

  const backOne = (event) => {
    setPIn(false);
    setSeconds(120);
    setIsActive(true);
    decreasePick();
  }

  function sound(){
    new Audio(chime).play();
  }

  

  

  const teams = ["The Warriors", "Lamario", "Lamario Eats PEEN", "Dak and Yellow", "I Shat My Fants", "The Rising Phoenix",
                  "Gustavo's Rocks", "It Really Hurts", "Mighty Acorns", "Kitty's Revenge"];

  const logos = [warrior, lamario, peen, dak, fants, phoenix, gustavo, hurts, dirk, leighton];


  return (
    <div>
      {!inProgress ?(
        <div className="App">
          <header className="App-header">
            <img src={bmldraft} className="App-logo" alt="logo" />
            <p>
              Welcome to the 2023-2024 BML Draft
            </p>
            <button className="button" onClick={startDraft} style={{width: '20vw', height: '10vh', fontSize: '25px'}}>Start Draft</button>
          </header>
          
        </div>
      ):(
        <div className = "timer">
          <header className = "timer-header" style={{backgroundColor: pIn ? 'black':null}}>
            <div className='words'  style={{opacity: pIn ? 0: 100}} >
              <h1 className='onC'>On the Clock: {teams[spot]}</h1>
            </div>
            
            
            <img src={logos[spot]} className='circle' alt={bml} style={{scale: pIn ? '1.75': '1'}} />
            <img src={logos[round%2===1? spot+1 - Math.floor(pick/10):spot-1 + Math.floor(pick/10)]} className='next' alt={bml} style={{opacity: pIn ? 0 : 100}}/>
            <img src={bml} className='next-bml' alt={bml} style={{opacity: pIn ? 0 : 100}}/>
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
