import bml from './BML_LOGO.png'
import './App.css';
import * as React from 'react';
import { useState, useEffect } from 'react';
import chime from './nfl-draft-chime.mp3'




function App(){
  const [seconds, setSeconds] = useState(5);
  const [isActive, setIsActive] = useState(false);
  const [pick, setPick] = useState(1);
  const [round, setRound] = useState(1);
  const [isOdd, setIsOdd] = useState(true);


  const [inProgress, setInProgress] = React.useState(false);

  useEffect(() => {
    let interval = null;
    if (isActive) {
      interval = setInterval(() => {
        if(seconds > 0){
        setSeconds(seconds => seconds - 1);
        }else{
          sound();
          setIsActive(false);
        }
      }, 1000);
    } else if (!isActive && seconds !== 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, seconds]);

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
    if(round == 1 && pick == 1){
      return;
    }
    if(pick == 1){
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
    setIsActive(!isActive);
  }

  function reset() {
    setSeconds(120);
    setIsActive(true);
    increasePick()
  }

  const startDraft = (event) => {

    console.log("Button Clicked")
    setInProgress(true);

  }

  const backOne = (event) => {
    decreasePick();
  }

  function sound(){
    new Audio(chime).play();
  }



  return (
    <div>
      {!inProgress ?(
        <div className="App">
          <header className="App-header">
            <img src={bml} className="App-logo" alt="logo" />
            <p>
              Welcome to the 2023-2024 BML Draft
            </p>
            <button className="button" onClick={startDraft}>Start Draft</button>
          </header>
          
        </div>
      ):(
        <div className = "timer">
          <header className = "timer-header">
            {seconds === 0 ? (<h1>The Pick is In...</h1>):(<h1 style={{color: '#282c34'}}>.</h1>)}
            <div className = "time-group">
                <h1 className='time'>{Math.floor(seconds/60)}:{seconds%60<10? 0 : ""}{seconds-(Math.floor(seconds/60)*60)}</h1>
                <button className="button" onClick={backOne}>
                  Previous Pick
                </button>
                <button className={`button button-primary button-primary-${isActive ? 'active' : 'inactive'}`} onClick={toggle}>
                  {isActive ? 'Pause' : 'Start'}
                </button>
                <button className="button" onClick={reset}>
                  Next Pick
                </button>
                <h1>Round: {round}, Pick: {pick}</h1>
                <h1>Current Spot: {isOdd ? pick : 11 - pick}</h1>
            </div>
          </header>
        </div>
      )}
    </div>
  
  
  
  
  
  );
}

export default App;
