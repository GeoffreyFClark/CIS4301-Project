import React, { useEffect, useState } from 'react';
import {Chessboard} from "react-chessboard"; // react-chessboard component
import {Chess} from "chess.js";  // chess.js library to provide logic to react-chessboard
import { useNavigate } from 'react-router-dom';
import { Slider, Select, MenuItem, FormControl, TextField, Typography, Box, Autocomplete, createFilterOptions, Button} from '@mui/material';
import players from './players.json';
import CustomTooltip from './CustomTooltip';

const openings = {
  "None": '',
  "King's Gambit": 'e4 e5 f4', //white opening 
  "Queen's Gambit": 'd4 d5 c4', //white opening
  "Sicilian Defense": 'e4 c5', //black opening
  "French Defense": 'e4 e6 d4 d5', //black opening
  "Caro-Kann Defense": 'e4 c6', //black opening
  "Scandinavian Defense": 'e4 d5', //black opening
  "London System": 'd4 Nf6 Bf4', //white opening
  "English Opening": 'c4', //white opening
  "Spanish Game / Ruy Lopez": 'e4 e5 Nf3 Nc6 Bb5', //white opening
  "Italian Game": 'e4 e5 Nf3 Nc6 Bc4', //white opening
  "Vienna Game": 'e4 e5 Nc3', //white opening
  "Indian Game": 'd4 Nf6', //black opening
  "King's Indian Defense": 'd4 Nf6 c4 g6 Nc3 Bg7 e4 d6', //black opening
  "Nimzo-Indian Defense": 'd4 Nf6 c4 e6 Nc3 Bb4', //black opening
  "Alekhine Defense": 'e4 Nf6', //black opening
  "Pirc Defense": 'e4 d6 d4 Nf6 Nc3 g6', //black opening
  "Modern Defense": 'e4 g6 d4 Bg7 Nc3 d6', //black opening
};

type Player = {
  PLAYER: string;
};

const playersData = players as { PLAYER: string }[];

const filterOptions = createFilterOptions({
  limit: 6,
});

export default function QueryOpenings() {
  const [game, setGame] = useState(new Chess());  // Creates new chess.js game instance, providing chess rules/logic to react-chessboard
  const [fen, setFen] = useState(game.fen());  // FEN represents a chessboard position, used to update react-chessboard
  // const [rows, setRows] = useState([]);  // To store and update data for the data grid
  // const [currentMoveIndex, setCurrentMoveIndex] = useState(0);  // To keep track of the current move index
  const [eloRange, setEloRange] = useState([100, 2900]);
  const [numTurns, setNumTurns] = useState([1, 201]);
  const [opening, setOpening] = useState('');
  const [dataChoice, setDataChoice] = useState('');
  const [graphBy, setGraphBy] = useState('year');
  const [openingColor, setOpeningColor] = useState('False');
  const navigate = useNavigate();
  const [startDate, setStartDate] = useState(1971);
  const [endDate, setEndDate] = useState(2023);
  const [playerInputValue, setplayerInputValue] = useState('');
  const [moveHistory, setMoveHistory] = useState<string[]>([]);


  const handleAutocompleteChange = (event: any, value: Player) => {
    if (value) console.log("Selected player: ", value.PLAYER);
  };

  const updateOpeningMoves = (selectedOpening) => {
    game.reset();
    if (selectedOpening && openings[selectedOpening]) {
      openings[selectedOpening].split(' ').forEach(move => game.move(move));
      setMoveHistory(openings[selectedOpening].split(' '));
      setFen(game.fen());
    } else {
      setMoveHistory([]);
      setFen(game.fen());
    }
  };

  const hardCodedQueryDescriptions = [
    { desc: "Specific Opening Prominence", tooltip: "Analyze trends in the prominence of a single chess opening. This case study query takes user inputs for opening moves, turn range, and date range." },
    { desc: "Risky Openings", tooltip: "Analyze trends in percentages of risky openings used by players. This product defines risky openings as openings highly likely to result in either a rapid win or a rapid loss. This query takes user inputs for date range." },  // "takes user inputs for minimum games, number of output rows" removed
    { desc: "Result Predictions", tooltip: "Analyze trends in the predictive power of comparative player Elo ratings. Elo ratings are a method for calculating the relative skill levels of players. It is expected that differences in player Elo ratings can be used to predict outcomes. This query takes user inputs for Elo range, turn range, and date range." },
    { desc: "Average Number of Turns", tooltip: "Analyze trends in the average number of turns between evenly matched players over time. Evenly matched players are identified using their Elo rating, a method for calculating the relative skill levels of players. This query takes user inputs for Elo range, turn range, and date range." },
    { desc: "3 Most Popular Openings by Year", tooltip: "Analyze trends in the most popular chess openings over time. This query takes user inputs for Elo range, turn range, and date range." }
  ];
  

  // Sends the player's move to the server for processing
  const sendMoveToServer = async (sourceSq, targetSq, piece) => {

    console.log("in sendMoveToServer")
    console.log(sourceSq, targetSq, piece);

    try {
      const response = await fetch('http://localhost:5000/api/query-openings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // Note: The server will need to parse/reformat this JSON data
        body: JSON.stringify({ sourceSq, targetSq, piece})  
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json(); 
      // {Use the response data from the server HERE, e.g. update data grid showing subsequent move frequency}
      // Use setRows() to update data grid
      console.log("Data from server: ", data);
    } 
    
    catch (error) {
      console.error("Failed to send move to server:", error);
    }
  };


  // Handles chess moves on react-chessboard
  const onDrop = (sourceSq, targetSq, piece) => {
    console.log(sourceSq);
    console.log(targetSq);
    console.log(piece);

    // Check if the move is legal using chess.js
    const legalMoves = game.moves({ square: sourceSq, verbose: true });
    const move = legalMoves.find(legalMove => legalMove.to === targetSq);
    if (!move) {
      return false; 
    }

    console.log(move);  // move = {color: 'w', piece: 'p', from: 'e2', to: 'e4', san: 'e4', …} use san notation for move history

    game.move(move);
    setFen(game.fen());
    setMoveHistory(prev => [...prev, move.san]);
    return true;
  };

  const handleHardCodedQuery = async (queryNumber) => {
    const recognizedOpeningName = Object.keys(openings).find(key => openings[key] === moveHistory.join(' '));
    const YaxisLabel= queryNumber === 1 ? 'Proportion of Database':
                      queryNumber === 2 ? 'Proportion of Database' :
                      queryNumber === 3 ? 'Observed Probability' :
                      queryNumber === 4 ? 'Average Turns' :
                      queryNumber === 5 ? '3 Most Popular Openings by Year' : 
                      'Data';

    const payload = {
      startDate,
      endDate,
      eloRange,
      numTurns,
      openingMoves: moveHistory.join(' '),
      openingName: recognizedOpeningName || "Opening", // Add the opening name if recognized
      queryNumber,
      graphBy,
      player: playerInputValue,
      openingColor,
      YaxisLabel,
    };

    try {
      const response = await fetch(`http://localhost:5000/api/sql-complex-trend-query-${queryNumber}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      navigate('/query-results', { state: { data, openingMoves: moveHistory.join(' '), openingName: recognizedOpeningName, dataChoice, graphBy, YaxisLabel, queryNumber } });
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };


  const submitSelections = async () => {
    const recognizedOpeningName = Object.keys(openings).find(key => openings[key] === moveHistory.join(' '));
    const YaxisLabel = dataChoice === 'winrate' ? 'Winrate %' :
                     dataChoice === 'popularity' ? 'Popularity %' : 'Proportion %';
    const payload = {
      startDate,
      endDate,
      eloRange,
      numTurns,
      openingMoves: moveHistory.join(' '),
      openingName: recognizedOpeningName || "Opening", // Add the opening name if recognized
      dataChoice,
      graphBy,
      player: playerInputValue,
      openingColor,
      YaxisLabel,
    };
  
    try {
      const response = await fetch('http://localhost:5000/api/query-results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
  
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      navigate('/query-results', { state: { data, openingMoves: moveHistory.join(' '), openingName: recognizedOpeningName, dataChoice, graphBy, YaxisLabel } });
    } catch (error) {
      console.error("Failed to submit query:", error);
    }
  };
 

  return (
    <div style={{ display: 'flex', alignItems: 'start', gap: '24px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'start', margin: '10px', width: '35vw' }}>
        <Chessboard 
            position={fen}
            onPieceDrop={onDrop}
        />
      
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'start', marginTop: '10px'}}>
        {hardCodedQueryDescriptions.map((item, i) => (
          <div key={i} style={{ margin: '2px', width: '35vw' }}> 
            <CustomTooltip content={item.tooltip}>
              <button onClick={() => handleHardCodedQuery(i + 1)} style={{ width: '35vw' }}> 
                {item.desc}
              </button>
            </CustomTooltip>
          </div>
        ))}
      </div>


      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', width: '500px' }}>
        <Typography marginTop={'0px'}>
          Preset Opening
        </Typography>
        <FormControl fullWidth sx={{height:'40px', backgroundColor: 'gray', border: '2px solid #ccc', borderRadius: '4px', marginBottom: '10px', marginTop: '0px'}}>
          <Select sx={{height:'40px'}}
            labelId="opening-label"
            value={opening}
            onChange={(e) => {
              setOpening(e.target.value);
              updateOpeningMoves(e.target.value);
            }}
          >
            {Object.keys(openings).map((key) => (
              <MenuItem key={key} value={key}>{key}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <Box sx={{ display: 'flex', flexDirection: 'row', gap: '16px', marginBottom: '10px' }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" gutterBottom>
              Start Year
            </Typography>
            <TextField
              sx={{ height:'40px', backgroundColor: 'gray', border: '2px solid #ccc', borderRadius: '4px', width: '100%' }}
              type="number"
              InputLabelProps={{
                shrink: true,
              }}
              variant="outlined"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              inputProps={{ min: 1850, max: 2022 }}
            />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" gutterBottom>
              End Year
            </Typography>
            <TextField
              sx={{ height: '40px', backgroundColor: 'gray', border: '2px solid #ccc', borderRadius: '4px', width: '100%' }}
              type="number"
              InputLabelProps={{
                shrink: true,
              }}
              variant="outlined"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              inputProps={{ min: 1851, max: 2023 }}
            />
          </Box>
        </Box>


        <Typography marginTop={'5px'}>
          Elo Rating Range (Elo System calculates the relative skill of players)
        </Typography>
        <Slider 
          value={eloRange}
          onChange={(e, newValue) => setEloRange(newValue)}
          valueLabelDisplay="auto"
          min={100}
          max={2900}
          valueLabelFormat={(value) => value + " Elo Rating"}
        />
        <Typography marginTop={'5px'}>
          Number of Turns
        </Typography>
        <Slider
          value={numTurns}
          onChange={(e, newValue) => setNumTurns(newValue)}
          valueLabelDisplay="auto"
          min={1}
          max={201}
          valueLabelFormat={(value) => value + " Moves"}
        />

        <Typography marginTop={'7px'}>Filter by a Player</Typography>
        <Autocomplete 
          sx={{ height: '40px', backgroundColor: 'gray', border: '2px solid #ccc', borderRadius: '4px', marginBottom: '12px', marginTop: '0px'}}
          freeSolo
          options={playerInputValue.length > 0 ? playersData : []}
          getOptionLabel={(option) => option.PLAYER || ''}
          filterOptions={filterOptions}
          onInputChange={(event, newInputValue) => {
            setplayerInputValue(newInputValue);
          }}
          renderInput={(params) => <TextField {...params} />}
        />

        <Typography marginTop={'0px'}>
          Data
        </Typography>
        <FormControl fullWidth sx={{ height: '40px', backgroundColor: 'gray', border: '2px solid #ccc', borderRadius: '4px', marginBottom: '12px', marginTop: '0px'}}>
          <Select sx={{height:'40px'}}
            labelId="data-choice-label"
            value={dataChoice}
            label="Data"
            onChange={(e) => setDataChoice(e.target.value)}
          >
            <MenuItem value="popularity">Popularity over time</MenuItem>
            <MenuItem value="winrate">Winrate over time</MenuItem>
          </Select>
        </FormControl>
        {dataChoice === 'winrate' && (
          <div>
          <Typography marginTop={'0px'}>
            Opening Color
          </Typography>
          <FormControl fullWidth sx={{ backgroundColor: 'gray', border: '2px solid #ccc', borderRadius: '4px', marginBottom: '12px', marginTop: '0px'}}>
            <Select
              labelId="opening-color-label"
              value={openingColor}
              onChange={(e) => setOpeningColor(e.target.value)}
            >
              <MenuItem value="white">White</MenuItem>
              <MenuItem value="black">Black</MenuItem>
            </Select>
          </FormControl>
          </div>
        )}
        <Typography marginTop={'0px'}>
          Graph By
        </Typography>
        <FormControl fullWidth sx={{ height: '40px', backgroundColor: 'gray', border: '2px solid #ccc', borderRadius: '4px', marginBottom: '12px', marginTop: '0px'}}>
          <Select sx={{height:'40px'}}
            labelId="graph-by-label"
            value={graphBy}
            onChange={(e) => setGraphBy(e.target.value)}
          >
            <MenuItem value="month">Month</MenuItem>
            <MenuItem value="quarter">Quarter</MenuItem>
            <MenuItem value="year">Year</MenuItem>
            <MenuItem value="2 years">2 Years</MenuItem>
            <MenuItem value="5 years">5 Years</MenuItem>
            <MenuItem value="decade">Decade</MenuItem>
          </Select>
        </FormControl>

        <Button
          variant="contained"
          onClick={() => submitSelections()}
        >
          Submit
        </Button>
      </div>
    </div>
    
  );
}