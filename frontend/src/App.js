/*********************************************************************
 * File Name: .js
 * 
 * Project: AFDK
 * 
 * Redirecting To: 
 * 
 * Copyright (c) 2023 Advanced Micro Devices , Inc. All rights reserved.
 **********************************************************************/
import React from "react";
import { useEffect,useRef,useState} from "react";
import { Button, Col, Container, Modal, Row,FormControl, Form } from "react-bootstrap";
import { confirmAlert } from "react-confirm-alert";
import { useDispatch, useSelector } from "react-redux";
import {
  clearLogIntervals,
  clearLogIntervalsLayout,
  getDiagrams,
  getPeakMeterMetrics,
  stopRunFlowPolling,
  saveDiagram,
  loadInfoModeGraph,
  loadDriverType,
  sendStatusControl,
  dspLogMaskStop,
  checkLicence,
  generateToken,
  openDatFile
} from "./actions/dbActions";
import Diagram from "./components/Diagram";
import LeftSidebar from "./components/LeftSidebar";
import Menu from "./components/Menu";
import ConfirmationBox from "./components/shared/ConfirmationBox";
import CreateNewDiagramForm from "./components/shared/CreateNewDiagramForm";
import AFDKDocument from "./components/AFDKDocument";
import { validateGraph } from "./actions/diagramActions";
import PlugPackage from "./components/ToolPluginPackage";
import {
  addDiagram,
  diagramRedo,
  diagramUndo,
  saveDiagramChanges,
  setCurrentDiagram,
  setDiagrams,
  setDiagramsName,
  setOpenUserFile,
  updateCurrentDiagram
} from "./store/diagramReducer";
import { Alert, MenuItem, Select, Snackbar } from "@mui/material";
import { setNotification, setApplicationMode, setDriverType,setLoadBinaries,setRunflowStatus,setDspLogMaskStart,setLicenceCheck, setLicenceInfo } from "./store/utilsReducer";
import { setLogs,setExecutionLogs } from "./store/logsReducer";
import HelpLicense from "./components/HelpLicense";
import About from "./components/About";
import { tapPeakNodeType } from "./utils/constants";
// import {ACP_renderCapture} from "./data"
import ACP_capture_graph from "./data/Audio Capture Template.json"
// import {ACP_render_graph} from "./data"
import Pdf from "./data/AFDK Help_Template.pdf"
import { messagingport } from "./components/Diagram/DiagramComponents";


const App = () => {
  const dispatch = useDispatch();
  const driverTypeRef = useRef(false);
  const licenceTypeRef = useRef(false);
  const filePath = process.env.REACT_APP_FILE_PATH;
  const tokenPath = process.env.REACT_APP_GENERATED_TOKEN_FILE_PATH;
  const openTemp = process.env.REACT_APP_OPEN_TEMPLATE;
  let diagramstemp = useSelector((state) => state.diagrams.diagrams);
  let notification = useSelector((state) => state.utils.notification);
  let driverType = useSelector((state) => state.utils.driverCheck);
  let licenceCheck = useSelector((state) => state.utils.licenceChack);
  let peerEngine = useSelector((state) => state.utils.peerEngineData)
  let runflowengineId = useSelector((state) => state.utils.runflowEnginesId)
  // let userJson = useSelector((state) => state.diagrams.userOpenFile);
  const runFlowStatus = useSelector((state) => state.utils.runFlowStatus);
   let currentPlugins = useSelector((state) => state.diagrams.currentPlugins);
  const appMode = useSelector((state) => state.utils.applicationMode);
  let loadBinariesFlag = useSelector((state) => state.utils.loadBinaries);
  let playingAudioEngines = useSelector(
    (state) => state.utils.playingAudioEngines
  );
  let tapPointEnabledAudioEngines = useSelector(
    (state) => state.utils.tapPointEnabledAudioEngines
  );
  const triggerCounter = useSelector((state) => state.diagrams.triggerCounter);
  const diagrams = [...diagramstemp].sort((a, b) =>
    a.name.localeCompare(b.name)
  );


  const diagramState = useSelector((state) => state.diagrams.diagramState);
  const isDiagramSaved = useSelector((state) => state.diagrams.isSaved);
  const editable = useSelector((state) => !state.utils.readonly);
  
  const dspLogStart = useSelector((state) => state.utils.dspLogMaskStart);
  const currentDiagram = diagramState.current;
  const peakMeters = currentDiagram
    ? currentDiagram.nodes.filter((nod) => nod.type === "peakmeter")
    : [];
  const [containersStatus, setContainersStatus] = useState({
    header: true,
    plugins: true,
    logs: true,
    properties: true,
    minimap: true,
  });

  let  peerEngineId = [];
  let mainEngineId= [];
  let messagePorts = currentDiagram
  ? currentDiagram.nodes.filter((nod) => nod.type === "messagingport")
  : [];
  let graphAudioEngine = currentDiagram ? currentDiagram.nodes.filter((node) => node.type === "group").map((node) => node.id) : [];
  let intGraphAE = graphAudioEngine.map(Number) 
  

  const [isHomeScreenVisible, setHomeScreenVisibility] = useState(true);
  const [isLicenceChecked,setIsLicenceCheck] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showLicense, setShowLicense] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [driver, setDriver] = useState();
  const [licenceFlag, setLicenceFlag] = useState();
  const [template,setTemplate]= useState(false)
  const [templateClick,setTemplateClick] = useState(1)
  const [checkedJson, setCheckedJson] = useState(false)

  
const [getToken,setGetToken]= useState(false)
const [tokenChange,setTokenChange] = useState(1)
const [pluginPackage,setPluginPackage]= useState(false)
 
  useEffect(() => {
    const diagrams = getDiagrams();
    dispatch(setDiagrams(diagrams));
    sessionStorage.clear();
  }, []);

  useEffect(() => {
    // setContainersStatus({
    //   ...containersStatus,
    //   plugins: appMode === "BUILDER"
    // })
    //  || appMode === "NDA"
    if(!currentDiagram || appMode === "BUILDER" || appMode === "NDA") {
      stopRunFlowPolling();
    }
  }, [appMode, currentDiagram])

  useEffect(() => {
    dispatch(setLoadBinaries(appMode === "INFORMATION"))
    dispatch(setRunflowStatus([]));
    stopRunFlowPolling();
  }, [appMode])

  useEffect(() => {
    if (playingAudioEngines.length === 0) {
      clearLogIntervals();
    }
  }, [playingAudioEngines]);

  // useEffect(() => {
  //   if (loadBinariesFlag) {
  //     if(currentDiagram && currentDiagram.name) {
  //       saveCurrentDiagram();
  //     } else {
  //       showSaveAs();
  //     }
  //   }
  // }, [loadBinariesFlag]);

  useEffect(() => {
    window.onbeforeunload = function () {
     return  isHomeScreenVisible ? null : isDiagramSaved ? null  : true;
    };
  }, [isHomeScreenVisible, isDiagramSaved]);
  useEffect(() => {
    return () => {
      window.onbeforeunload = null;
    };
  }, []);
  /**
   * enable this if we need auto validation.
   */
  // useEffect(() => {
  //   dispatch(validateGraph(true));
  // }, [currentDiagram, triggerCounter])
  useEffect(() => {
    const buffersWithPeakmeter = [];
    const playingAudioEngineNodes = {};
    currentDiagram &&
      currentDiagram.nodes.map((nod) => {
        if (nod.type === "group" && playingAudioEngines.includes(nod.id)) {
          playingAudioEngineNodes[nod.id] = nod;
        }
      });
    currentDiagram &&
      currentDiagram.nodes.map((nod,index) => {
        if (
          playingAudioEngines.includes(nod.parentNode) &&
          tapPointEnabledAudioEngines.includes(nod.parentNode) &&
          tapPeakNodeType.includes(nod.type) &&
          nod.data.peakmeter
        ) {
           const audioEngine = playingAudioEngineNodes[nod.parentNode];
          buffersWithPeakmeter.push({
            bufferid: parseInt(nod.id),
            channels: parseInt(nod.data.channels),
            bitdepth:parseInt(nod.data.bitdepth),
            sampleformat:parseInt(nod.data.sampleformat),
            channelmask:parseInt(nod.data.channelmask),
            samplerate:parseInt(nod.data.samplerate),
            audioengineid: parseInt(nod.parentNode),
            dspid: parseInt(audioEngine.data.dsp),
            engineclass: parseInt(audioEngine.data.engineclass),
            enginetype: parseInt(audioEngine.data.enginetype),
          });
        }
      });
    dispatch(getPeakMeterMetrics(buffersWithPeakmeter));
  }, [
    playingAudioEngines,
    peakMeters.length,
    triggerCounter,
    tapPointEnabledAudioEngines,
  ]);

  // useEffect(() =>{
    // if(appMode ==="INFORMATION" ){
    //   try{
    //     let newNodes= {};
    //     const newNode1 = []
    //     let sourceMessagePort = [];
    //     let targetMessagePort = [];
    //   const currentDiagram = diagramState.current;
    //   const getNodeId = () => {
    //     let maxId = 0;
    //     currentDiagram.nodes.map((node) => {
    //       if (parseInt(node.id) > maxId) {
    //         maxId = parseInt(node.id);
    //       }
    //     });
    //     return (maxId + 1).toString();
    //   };
    //   const getNodeId2 = () => {
    //     let maxId = 0;
    //     currentDiagram.nodes.map((node) => {
    //       if (parseInt(node.id) > maxId) {
    //         maxId = parseInt(node.id);
    //       }
    //     });
    //     return (maxId + 2).toString();
    //   };
    //   const getEdgeId = () => {
    //     let maxId = 0;
    //     currentDiagram.edges.map((edge) => {
    //       if (parseInt(edge.id) > maxId) {
    //         maxId = parseInt(edge.id);
    //       }
    //     });
    //     return (maxId + 1).toString();
    //   };
    //   let maxYPosition = 0;
    //   currentDiagram.nodes.map((node) => {
    //     if (node.position && node.position.y && node.position.y > maxYPosition) {
    //       maxYPosition = node.position.y + node.height;
    //     }
    //   });
    //   const position = {
    //     x: 50,
    //     y: maxYPosition + 100,
    //   };
    //     runFlowStatus &&  runFlowStatus.forEach((mainEnId) =>{
    //       mainEngineId = mainEnId.engine_id
          //source Audio engine id graph contains message port or not
  //  sourceMessagePort = currentDiagram ? currentDiagram.nodes.find((nod) => nod.id === mainEngineId.toString() && nod.type === "messagingport"
  // alert(typeof nod.id + "sourceAudioEngine" + typeof mainEngineId)
 
  // ) : []
 
  //         if(mainEnId.peerenginecount !== 0 && intGraphAE.includes(mainEngineId)){ 
  //           // console.log(mainEnId.peerenginecount)
  //           mainEnId &&   Object.entries(mainEnId).map((peerKey) =>{
  //              if(peerKey.includes("peer_engine_info")){
  //             peerKey.map((pData) =>{
  //               pData.peer_engine_data && pData.peer_engine_data.forEach((enid)=>{
  //                 // console.log(enid.engine_id)
  //                 peerEngineId = enid.engine_id
  //                 //target Audio engine id graph contains message port or not
  //            targetMessagePort = currentDiagram ? currentDiagram.nodes.find((nod) => nod.id === peerEngineId.toString() && nod.type === "messagingport") : [] 
  //               //  alert(sourceMessagePort + "   jhgjhgjhgh  ")
  //     //            if(!sourceMessagePort && !targetMessagePort){
  //                 const newNode1 = {
  //                   id: getNodeId(),
  //                   type: "messagingport",
  //                   position,
  //                   data: {
  //                     label: "messagingport",
  //                   },
  //                   parentNode: mainEngineId,
  //                   extent: "parent"
  //                 }
                  
      //            }
        //            if(!sourceMessagePort){
        //              //messaging port not exists creating a new node
        //             const newNode = {
        //               id: getNodeId(),
        //               type: "messagingport",
        //               position,
        //               data: {
        //                 label: "messagingport",
        //               },
        //               parentNode: mainEngineId,
        //               extent: "parent"
        //             }

        //             const newEdge = {
        //               ...currentDiagram.edges,	
        //                       source:newNode.id,
        //                       sourceHandle: "0",
        //                       target: targetMessagePort,
        //                       targetHandle: "0",
        //                       id: getEdgeId(),	
        //                       sourceType: "messagingport",	
        //                       targetType: "messagingport",	
        //                       sourceNodeParent: mainEngineId,	
        //                       targetNodeParent: peerEngineId,	
        // };	
        //  const newEdges = currentDiagram.edges.concat(newEdge);	
        
        //             // currentDiagram = [currentDiagram.nodes.push(newNode)]
        //  newNodes = [ ...currentDiagram.nodes,newNode ];	
        //    dispatch(updateCurrentDiagram({ nodes:newNodes}));
        //            }
        //            if(!targetMessagePort){
        //             const newNode = {
        //               id: getNodeId(),
        //               type: "messagingport",
        //               position,
        //               data: {
        //                 label: "messagingport",
        //               },
        //               parentNode: peerEngineId,
        //               extent: "parent"
        //             }

        //             const newEdge = {
        //               ...currentDiagram.edges,	
        //                      source:sourceMessagePort,
        //                      sourceHandle: "0",
        //                      target: newNode.id,
        //                      targetHandle: "0",
        //                       id: getEdgeId(),	
        //                       sourceType: "messagingport",	
        //                       targetType: "messagingport",	
        //                       sourceNodeParent: newNode.id,	
        //                       targetNodeParent: peerEngineId,	
        // };	
        //  const newEdges = currentDiagram.edges.concat(newEdge);	
        //             // currentDiagram = [currentDiagram.nodes.push(newNode)]
        //  newNodes = [ ...currentDiagram.nodes,newNode ];	
        //     dispatch(updateCurrentDiagram({ nodes:newNodes}));
        //            }
      //              else if(sourceMessagePort && targetMessagePort){
      //             const newEdge = {
      //               ...currentDiagram.edges,	
      //                       id: getEdgeId(),	
      //                       sourceType: "messagingport",	
      //                       targetType: "messagingport",	
      //                       sourceNodeParent: mainEngineId,	
      //                       targetNodeParent: peerEngineId,	
      // };	
      //  const newEdges = currentDiagram.edges.concat(newEdge);	
      //  dispatch(updateCurrentDiagram({ edges:newEdges}));
      //              }
                  //  else if(sourceMessagePort.length !== 0){
                  //   //message ports already exists
                  //   currentDiagram.edges.map((mpEdges) =>{
                  //     if(mpEdges.sourceType && mpEdges.targetType === "messageport"){
                  //       const newEdge = {
                  //         ...currentDiagram.edges,	
                  //         sourceNodeParent : mainEngineId,
                  //         targetNodeParent :peerEngineId,
                  //              };	
                  //              const newEdges = currentDiagram.edges.concat(newEdge);	
                  //       dispatch(updateCurrentDiagram({edges : newEdges}))
                  //     }
                  //   })
                  //  }
                   
    
  //               })
  //               const newNode2= {
  //                 id: getNodeId2(),
  //                 type: "messagingport",
  //                 position,
  //                 data: {
  //                   label: "messagingport",
  //                 },
  //                 parentNode: peerEngineId,
  //                 extent: "parent"
  //               }

  //               const newEdge = {
  //                 ...currentDiagram.edges,	
  //                         source:newNode1.id,
  //                         sourceHandle: "0",
  //                         target: newNode2.id,
  //                         targetHandle: "0",
  //                         id: getEdgeId(),	
  //                         sourceType: "messagingport",	
  //                         targetType: "messagingport",	
  //                         sourceNodeParent: mainEngineId,	
  //                         targetNodeParent: peerEngineId,	
  //   };	
  //    const newEdges = currentDiagram.edges.concat(newEdge);	
  //     // const newNode = [...newNode1,newNode2]
  //               // currentDiagram = [currentDiagram.nodes.push(newNode)]
  //    newNodes = [ ...currentDiagram.nodes,{...newNode1,newNode2} ];	
  //      dispatch(updateCurrentDiagram({ nodes:newNodes,edges: newEdges}));

  //               dispatch(saveDiagram(currentDiagram, currentDiagram.name, true,true))
  //               })
  //              }
           
  //          })
  //       }
  //       if(mainEnId.peerenginecount === 0 && intGraphAE.includes(mainEngineId)){
  //         if(sourceMessagePort && targetMessagePort){
  //            //write code to delete the edge
  //         }
  //       }
  //       })
  //     } catch{
  //       dispatch(	
  //         setNotification({ type: "error", message: "error in creating message port and  edge!" })	
  //      );
  //     }
  // }
  
  // },[runFlowStatus])
  

  useEffect(() => {
    //  else{
       if(!licenceTypeRef.current){
          licenceTypeRef.current = true;
          getLicenceCheck()
         }
  }, []);

  const getLicenceCheck = () =>{
    dispatch(checkLicence()).then((data) => {
      setLicenceFlag(data);
      dispatch(setLicenceCheck(data));
     })
  }

  const handleViewChange = (container, status) => {
    setContainersStatus({
      ...containersStatus,
      [container]: status ? status : !containersStatus[container],
    });
  };

  const getDiagramId = () => {
    return Math.floor(Math.random() * (256 - 1 + 1) + 1);
  };

  const getDiagramUid = () => {
    return `graph-${new Date().getTime()}`;
  };

  // function handlePluginPackChange(event) {
  //   setSelecetPlPack(event.target.value);
  // }

  const handleModeChange = (isInformationMode) => {
      // dispatch(loadDriverType()).then((data) => {
      //   setDriver(data);
      //   dispatch(setDriverType(data));
      // });
    // alert(driverType+"  driver Type not getting  " + licenceCheck.includes(3))
    
    if (!isDiagramSaved && isInformationMode && appMode !== "NDA") {
      alert("Please save your changes before changing the mode");
    } else {
      dispatch(loadDriverType()).then((data) => {
        setDriver(data);
        dispatch(setDriverType(data));
      if(isInformationMode && (data === 1 && licenceCheck.includes(3))) {
        alert("Currently you have AFDK Driver. Please install PRODUCTION Driver...!");
        return;
      }
     if(isInformationMode && data === 2) {
        setToInformationMode();
      } else if( isInformationMode && (data === "no driver installed" || data === 104) ){
        // || driverType === 104 || driverType === "fail" || driverType === undefined
        alert("Please install driver.Currenty you have not installed any driver!")
      } else{
        dispatch(setExecutionLogs([]));
        dispatch(sendStatusControl(false))
        showDesignerScreen();
      }
      handleViewChange("properties", false);
      })
    }
  //  }
  };

  const handleTempOpen= (tempFile) =>{
    dispatch(setOpenUserFile(`${openTemp}\\`+tempFile))      
      dispatch(openDatFile(false)).then((data) => {
          if (validateDiagramJson(data)) {
          dispatch(setCurrentDiagram(data));
          dispatch(validateGraph(true));
          dispatch(setLogs([]));
          setTemplate(false)
        };

      })
  }
  const dropdownInput= {
    paddingTop: 0,
      //  width: 150,
       height: 25,
       color: "#000",
       fontSize: "11px",
       background: "#ffffff",
}
const handleTempChange=(e)=>{
  // e.preventDefaualt();
  setTemplateClick(e.target.value)
}

  const TemplateModal= () =>{
    return(
      <Modal show={!!template} onHide={() => setTemplate(false)}>
      <Modal.Header closeButton>
        <Modal.Title>Open Templates</Modal.Title>
      </Modal.Header>
      <Modal.Body>
      <Select 
                      value={templateClick}
                      onChange={handleTempChange}
                      style={dropdownInput}
                    >
                      {/* <MenuItem style={dropdownInput} key={1} value={"Capture"} onClick = {()=>handleTempOpen("Capture")}>1.Audio Capture Template</MenuItem> */}
                      <MenuItem style={dropdownInput} key={2} value={"Render.dat"} onClick = {() =>handleTempOpen("Render.dat")}>2.Audio Render Template</MenuItem> 
                      <MenuItem style={dropdownInput} key={3} value={"Render and Capture.dat"} onClick = {()=>handleTempOpen("Render and Capture.dat")}>3.Audio Render Plus Capture Template</MenuItem>
                    </Select>
      </Modal.Body>
      {/* <Modal.Footer>
        <Button variant="primary" onClick={() => setTemplate(false)}>
          Open
        </Button> */}
        {/* <Button variant="primary" onClick={() => setTemplate(false)}>
          Save Changes
        </Button> */}
      {/* </Modal.Footer> */}
    </Modal>
    )
  }


 
   const handleTemplate = () => {setTemplate(true)}
   const handlePlugPackage = () => {setPluginPackage(true)}
   const handleGetToken = () => {  dispatch(generateToken(tokenPath)); }

  const createNewDiagram = async (name, onClose,jsonSave) => {
    // alert(checkedJson + "Created New Diagram")
    const diagram = await dispatch(
      saveDiagram(
        {
          id: getDiagramId(),
          uid: getDiagramUid(),
          name,
          nodes: [],
          edges: [],
        },
       name,
        false,
        jsonSave
      )
    );
    sessionStorage.clear();
    dispatch(setDiagramsName(name))
    dispatch(addDiagram(diagram));
    dispatch(setCurrentDiagram(diagram));
    dispatch(saveDiagramChanges(true));
    dispatch(setLogs([]));
    dispatch(validateGraph(true));
    onClose();
  };

  const saveDiagramAs = async (name, onClose, shouldExit = false,jsonSave) => { 
    // alert(checkedJson + "save Diagram as")
    const diagram = await dispatch(
      saveDiagram(
        {
          id: getDiagramId(),
          uid: getDiagramUid(),
          name,
          nodes: currentDiagram.nodes,
          edges: currentDiagram.edges,
        },
        name,
        false,
        jsonSave
      )
    );
    // alert(checkedJson + "Save Diagram As")
    dispatch(addDiagram(diagram));
    if (shouldExit) {
      exitDiagram();
    } else {
      dispatch(setCurrentDiagram(diagram));
      dispatch(saveDiagramChanges(true));
    }
    dispatch(	
      setNotification({ type: "success", message: "Graph saved successfully at "+ `${filePath }` })	
   );
    onClose();
  };

  const exitDiagram = (onClose = null) => {
    if(dspLogStart === true){
    dispatch(dspLogMaskStop({
      dsplogmask: 0,
      keywordmask : 0,
      dspid: 0
    })

  );
  dispatch(setDspLogMaskStart(false))
    }

    if(appMode === "INFORMATION"){
      dispatch(sendStatusControl(false))
      stopRunFlowPolling();
      }
    setHomeScreenVisibility(true);
    if (onClose) onClose();
    setTimeout(() => {
    dispatch(setCurrentDiagram(undefined));
    dispatch(saveDiagramChanges(true));
    dispatch(setLogs([]));
    clearLogIntervalsLayout();
    sessionStorage.clear();
  }, 1000)
  };

  const showCreateNewDiagram = () => {
    //dispatch(setCurrentDiagram(undefined));
    // alert(checkedJson+"   New  ")
    confirmAlert({
      customUI: ({ onClose }) => (
        <CreateNewDiagramForm
          heading={"Create New Layout"}
          diagrams={diagrams}
          handleCancel={onClose}
          handleSavePopup={(name,jsonSave) => createNewDiagram(name, onClose,jsonSave)}
          //  handleCheckJson = {setCheckedJson(true)}
        />
      ),
    });
    
  };

  const showExitConfirmation = (isNewDiagram) => {
    confirmAlert({
      customUI: ({ onClose }) => (
        <ConfirmationBox
          isNewDiagram
          heading={
            <div>
              <h4>You have unsaved changes.</h4>
              <h6 style={{ marginBottom: "20px" }}>
                You want to discard them?
              </h6>
            </div>
          }
          handleCancel={onClose}
          handleSaveAndExit={() => {
            if (currentDiagram && !currentDiagram.name) showSaveAs(true);
            else {
              if (isNewDiagram) {
                showCreateNewDiagram();
              } else {
                saveCurrentDiagram(true);
                onClose();
              }
            }
          }}
          handleDiscard={() =>
            isNewDiagram ? showCreateNewDiagram() : exitDiagram(onClose)
          }
        />
      ),
    });
  };

  const showSaveOpen = () => { 
    confirmAlert({
      customUI: ({ onClose }) => (
        <CreateNewDiagramForm
          heading={"Save Layout and Open"}
          diagrams={diagrams}
          handleCancel={() => {
            onClose();
          }}
        //  handleCheckJson = {setCheckedJson(true)}
          handleSavePopup={(name,jsonSave) => {
            saveDiagramAs(name, onClose,jsonSave)
            document.getElementById("open-diagram-button").click() 
            onClose()
          }
          }
        />
      ),
    });
  };
  //While open another graph when already some graph loaded in thebuilder Area
  const showOpenConfirmation = (isNewDiagram) => {
    confirmAlert({
      customUI: ({ onClose }) => (
        <ConfirmationBox
          isNewDiagram
          heading={
            <div>
              <h4>You have unsaved changes.</h4>
              <h6 style={{ marginBottom: "20px" }}>
                You want to discard them?
              </h6>
            </div>
          }
          handleCancel={onClose}
          handleSaveAndExit={() => {            
           if (currentDiagram && !currentDiagram.name) showSaveOpen(true);
            else {
              if (isNewDiagram) { 
              saveCurrentDiagram()
              document.getElementById("open-diagram-button").click() 
              onClose();
              }
            }
          }}
          handleDiscard={()=>{
            if(isNewDiagram){
              document.getElementById("open-diagram-button").click()  
              onClose();
            }
          }          
          }
        />
      ),
    });
  };


  const showSaveAs = (shouldExit = false) => {
  //  let jsonSave = window.confirm("Chick OK to save Graph JSON also!")
  //  if(jsonSave){
    confirmAlert({
      customUI: ({ onClose }) => (
        <CreateNewDiagramForm
          heading={"Save Layout As"}
          diagrams={diagrams}
          // handleCheckJson = {setCheckedJson(true)}
          handleCancel={() => {
            onClose();
            if (shouldExit) {
              exitDiagram();
            }
          }}
          handleSavePopup={(name,jsonSave) => saveDiagramAs(name, onClose, shouldExit,jsonSave)}
        />
      ),
    });
  // } else{

  // }
    // alert(" Click on Save " + checkedJson)
  };

  const validateDiagramJson = (jsonObj) => {
    return (
      !!jsonObj &&
      !!jsonObj.id &&
      !!jsonObj.name &&
      !!jsonObj.nodes &&
      !!jsonObj.edges
    );
  };

  const showDesignerScreen = () => { 
    if(licenceCheck.includes(3)){
    dispatch(setApplicationMode("NDA"));
    }
    else {
      dispatch(setApplicationMode("BUILDER"));
    }
    setHomeScreenVisibility(false);
    dispatch(
      setCurrentDiagram({
        id: getDiagramId(),
        uid: getDiagramUid(),
        name: "",
        nodes: [],
        edges: [],
      })
    );
    dispatch(saveDiagramChanges(true));
    
    dispatch(validateGraph(true));
  };

  const setToInformationMode = async () => {
    setHomeScreenVisibility(false);
    await dispatch(loadInfoModeGraph());
   
  };

  const saveCurrentDiagram = async (shouldExit = false) => {
    let result= []
    // const saveJSON =  window.confirm("Please confirm on JSON file generation!");
    //buttons should be 1.With JSON or 2.Without JSOn
    // if(saveJSON){
      // alert("Already saved Graph "+ checkedJson)
       result = await dispatch(saveDiagram(currentDiagram, currentDiagram.name, true,false));
    // }
    // else{
    // result = await dispatch(saveDiagram(currentDiagram, currentDiagram.name, true,false));
    // }
    dispatch(saveDiagramChanges(true));
    if(result &&  result != "file_name exist"){
    
    if(appMode !== "INFORMATION" || ((appMode === "BUILDER" || appMode === "NDA") && loadBinariesFlag)){
    dispatch(	
      setNotification({ type: "success", message: "Graph saved successfully!" })	
   );
    }
    if (shouldExit) {
      exitDiagram();
    }
  }else{
    dispatch(
      setNotification({ type: "error", message: "Error in saving the graph" })
    );
  }
  };

  const setNullValue = (event) => {
    document.getElementById(event.target.id).value = null;
  };
  // const loadLatestMetadata = (diagramJson) => {
  //   if(diagramJson && diagramJson.nodes && diagramJson.nodes.length > 0) {
  //     return {
  //       ...diagramJson,
  //       nodes: diagramJson.nodes.map(node => {
  //         if(node.type === 'plugin') {
  //           return { ...node, data: { ...node.data, metadata: currentPlugins[node.data.guid] ? currentPlugins[node.data.guid] : node.data.metadata }}
  //         } else {
  //           return node;
  //         }
  //       })      
  //     }
  //   } else {
  //     return diagramJson;
  //   }
  // }

  // const handleHelp = (e) => {
  //   setShowLicense(true);
  //   // setLicenceInfo(data)
  // }

  const handleOpenDiagram = (event) => {
    let files = event.target.files;
    let f = files[0];
    let diagramJson_name= event.target.files[0].name;
   let diagramName =  diagramJson_name.replace(/\.[^/.]+$/, "")

    let reader = new FileReader();
    reader.readAsDataURL(event.target.files[0]);	

    reader.onload = (function (theFile) 
    {
      return function (e) {
            dispatch(setDiagramsName(diagramName))
              dispatch(setOpenUserFile(e.target.result))
            dispatch(openDatFile(true)).then((data) => {
              if (validateDiagramJson(data)) {
                dispatch(setCurrentDiagram(data));
               dispatch(validateGraph(true));
               dispatch(setLogs([]));
                 }
            })
    
            
            // dispatch(loadDriverType()).then((data) => {
            //   setDriverVar(data);
            //   dispatch(setDriverType(data));
            //   // driver_res = data
            // });
            //  setOpenFile(e.target.result);
            // if(userJson){
            //   if (validateDiagramJson(userJson)) {
            //  dispatch(setCurrentDiagram(userJson));
            // dispatch(validateGraph(true));
            // dispatch(setLogs([]));
            //   }
            // }
          // } else {
          //   dispatch(
          //     setNotification({
          //       type: "error",
          //       message: "Invalid graph input data",
          //     })

          //   );
          // }
        // }
        // catch (err) {
        //   dispatch(
        //     setNotification({
        //       type: "error",
        //       message: "Error in opening the graph",
        //     })
        //   );
        // }
      };
    })(f);
    // reader.readAsText(f);

  };


    if (isHomeScreenVisible ) {
    {
      /* Launch AFDK Mode section  Starts  */
    }
    return (
      <div className="home-screen">
       <div className={`center-content ${(licenceCheck !== 0 && licenceCheck !== undefined && licenceCheck !== 100 && licenceCheck !== 101 && licenceCheck !==102 && licenceCheck !==103) ? 'validlicense' : 'invalidlicense'}`}>
          <div className="card-box text-center">
            <div className="title">
              <div className="MInLogo inline-place"></div>
              <h1 className="text-white">Audio Framework Developer Kit</h1>
            </div>
            <div className="inner-section">
              <div className="change-modes text-center">
                {/* {BuilderButton &&   */}
                <Button
                  variant="primary"
                  type="button"
                  onClick={showDesignerScreen} title="Builder Mode"
                >
                  Builder Mode
                </Button>
               {/* }
                 { InfoButton &&   */}
                <Button
                  variant="primary"
                  type="button" title="Information Mode"
                  onClick={() => {
                    dispatch(loadDriverType()).then((data) => {
                      setDriver(data);
                      dispatch(setDriverType(data));
                    
                    if(data === 2) {
                      setToInformationMode()
                    }
                    if(((data === 1 && licenceCheck.includes(3)) || data === 1)) {
                      alert("Currently you have AFDK Driver. Please install PRODUCTION Driver!");
                    }
                    else if( data === undefined || data === 0 || data === 104){
                      alert("Please install Driver. Currently No Driver is installed in your machine!")
                    }
                  });
                   }}
                >
                  Information Mode
                </Button>
              </div>
            </div>
          </div>
        </div>
       
        <div className={`center-content ${(licenceCheck ===103) ? 'validlicense' : 'invalidlicense'}`}>
        <div className="card-box text-center">
            <div className="title">
              <h1 className="text-white">AFDK Application</h1>
            </div>
            <div className="inner-section">
              <div className="change-modes text-center">
               Please check your license details
              </div>
            </div>
          </div>
          </div>

          <div className={`center-content ${(licenceCheck ===100) ? 'validlicense' : 'invalidlicense'}`}>
        <div className="card-box text-center">
            <div className="title">
              <h1 className="text-white">AFDK Application</h1>
            </div>
            <div className="inner-section">
              <div className="change-modes text-center">
               Please check your license file
              </div>
            </div>
          </div>
          </div>
          <div className={`center-content ${(licenceCheck ===101) ? 'validlicense' : 'invalidlicense'}`}>
        <div className="card-box text-center">
            <div className="title">
              <h1 className="text-white">AFDK Application</h1>
            </div>
            <div className="inner-section">
              <div className="change-modes text-center">
               Please check no licence key found!
              </div>
            </div>
          </div>
          </div>

          <div className={`center-content ${(licenceCheck ===102) ? 'validlicense' : 'invalidlicense'}`}>
        <div className="card-box text-center">
            <div className="title">
              <h1 className="text-white">AFDK Application</h1>
            </div>
            <div className="inner-section">
              <div className="change-modes text-center">
               Please check no licence key as response!
              </div>
            </div>
          </div>
          </div>

          <div className={`center-content ${(licenceCheck ===0 || licenceCheck === undefined) ? 'validlicense' : 'invalidlicense'}`}>
        <div className="card-box text-center">
            <div className="title">
              <h1 className="text-white">AFDK Application</h1>
            </div>
            <div className="inner-section">
              <div className="change-modes text-center">
              No License Data!
              </div>
            </div>
          </div>
          </div>

      </div>
    );
    {
      
      /*Launch AFDK Mode section ends */
    }
  // }
  //  }
   }

// }
  return (
    <Container className="RootContainer">
      <Row className="menu-container">
        <Menu
          show={{ ...containersStatus }}
          editable={editable}
          diagramState={diagramState}
          handleViewChange={handleViewChange}
          handleChangeMode={handleModeChange}
          handleCreateNew={() =>
            currentDiagram &&
            (currentDiagram.name || currentDiagram.nodes.length > 0) &&
            !isDiagramSaved
              ? showExitConfirmation(true)
              : showCreateNewDiagram()
          }
         handleOpenDiagram={() => {
            if (
              currentDiagram &&
              !isDiagramSaved &&
              (currentDiagram.name || currentDiagram.nodes.length > 0)
            ) {
              showOpenConfirmation(true)
            } else if(!currentPlugins || Object.keys(currentPlugins).length === 0) {	
              window.alert("Please load plugin depot before opening the diagram");
            } else {
              document.getElementById("open-diagram-button").click();
            }
          }}
          handleSave={() =>
            currentDiagram && currentDiagram.name
              ? saveCurrentDiagram()
              : showSaveAs()
          }
          handleSaveAs={() => showSaveAs()}
          disableSave={!currentDiagram}
          handleExit={() =>
            currentDiagram &&
            !isDiagramSaved &&
            (currentDiagram.name || currentDiagram.nodes.length > 0)&& appMode === "BUILDER"
              ? showExitConfirmation(false)
              : exitDiagram()
          }
          handleUndo={() => dispatch(diagramUndo())}
          handleRedo={() => dispatch(diagramRedo())}
          handleShowHelp={() => window.open(Pdf)
            // setShowHelp(true)
          }
          // handleShowHelp={handleHelp}
          handleShowLicense={() => setShowLicense(true)}
          handleShowAbout={() => setShowAbout(true)}
          handleOpenTemplate={handleTemplate}
          handleToken= {handleGetToken}
          handlePluginPackage= {handlePlugPackage}
        />
       { template && <TemplateModal/>}
       {pluginPackage && <PlugPackage show={pluginPackage} handleClose={() => setPluginPackage(false)}/>}
      </Row>
      <Row
        style={
          containersStatus.header ? { marginTop: "0" } : { marginTop: "25px" }
        }
      >
        <Col
          style={{
            flex: "inherit",
            width: containersStatus.plugins ? "18vw" : "2vw",
          }}
          className="pt-0"
        >
          <LeftSidebar
            show={containersStatus.plugins}
            handleViewChange={handleViewChange}
            editable={editable}
          />
        </Col>
        <Col style={{ width: containersStatus.plugins ? "80vw" : "97vw" }}>
          <Diagram
            editable={editable}
            containersStatus={containersStatus}
            handleViewChange={handleViewChange}
          />
        </Col>
      </Row>
      <Snackbar
        open={!!notification}
        autoHideDuration={5000}
        onClose={() => dispatch(setNotification(undefined))}
        anchorOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
      >
        {notification && (
          <Alert
            onClose={() => dispatch(setNotification(undefined))}
            severity={notification ? notification.type : ""}
            sx={{ width: "100%" }}
          >
            {notification ? notification.message : ""}
          </Alert>
        )}
      </Snackbar>

      {/* AFDK Document */}
      {showHelp && (
        <AFDKDocument show={showHelp} handleClose={() => setShowHelp(false)} />
      )}
      {/* License */}
      {showLicense && (
        <HelpLicense
          show={showLicense}
          handleClose={() => setShowLicense(false)}
        />
      )}
      {/* About */}
      {showAbout && (
        <About show={showAbout} handleClose={() => setShowAbout(false)} />
      )}
      <input
        type={"file"}
        id="open-diagram-button"
        style={{ visibility: "hidden" }}
        // accept={"application/JSON"}
        onChange={handleOpenDiagram}
        onClick={setNullValue}  
      />
    </Container>
  );
};

export default App;