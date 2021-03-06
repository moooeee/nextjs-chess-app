import {useRef, useState, useMemo} from "react"
import {useDrop} from "react-dnd"
import {useDispatch, useSelector} from "react-redux"
import {getSquareColorFromName} from "../utils/utils"
import {
  Box,
  Popover,
  PopoverContent,
  PopoverBody,
  Portal,
  VStack,
  Button,
} from "@chakra-ui/react"
import {chess} from "../chessEngine/chess"
import {useEffect} from "react"
import {worker} from "../chessEngine/engineWorker"
import {engine} from "../chessEngine/engine"
import {useMove} from "../utils/useMove"
import Image from "next/image"
import styles from "./styles/promotionPopup.module.scss"
import PromotionPopup from "./promotionPopup"
import {useMediaQuery} from "@chakra-ui/media-query"

function Square({name, children}) {
  const hoveredSquare = useSelector((state) => state.hoveredSquare)
  const selectedSquare = useSelector((state) => state.selectedSquare)
  const {userColor} = useSelector((state) => state.sides)
  const {piecesTheme} = useSelector((state) => state.appearance)
  const {promotionSquare, isGameOver} = useSelector((state) => state.game)
  const {sourceSquare: source, destinationSquare: destination} = useSelector(
    (state) => state.game.currentPosition
  )
  const dispatch = useDispatch()
  const {highlightedSquares} = useSelector((state) => state.arrows)
  const {move} = useMove()
  const isLandscape = window.innerHeight < window.innerWidth
  const [isMobile] = useMediaQuery("(max-width: 850px")

  const sourceSquare = useRef(null)
  const [props, drop] = useDrop(() => ({
    accept: "piece",
    drop: (item, monitor) => {
      if (isGameOver) return
      if (monitor.canDrop()) {
        if (item.square === name) return
        sourceSquare.current = item
        move({from: item.square, to: name}, item)
      }
    },
    hover: (_item, _monitor) => {
      dispatch({type: "set-hovered-square", payload: {square: name}})
    },
    canDrop: (monitor) => {
      return chess
        .moves({square: monitor.square, verbose: true})
        .some((square) => square.to === name)
    },
    collect: (monitor) => {
      return {canDrop: monitor.canDrop()}
    },
  }))

  const canDrop =
    props.canDrop ||
    (selectedSquare.square &&
      chess
        .moves({square: selectedSquare.square, verbose: true})
        .some((move) => move.to === name))

  const isSquareHighlighted = useMemo(() => {
    return highlightedSquares?.includes(name)
  }, [highlightedSquares])

  let showPromotionPopup
  if (promotionSquare === name) {
    if (isMobile) {
      if (isLandscape) {
        showPromotionPopup = false
      } else {
        showPromotionPopup = true
      }
    } else {
      showPromotionPopup = true
    }
  } else {
    showPromotionPopup = false
  }

  return (
    <Box
      ref={drop}
      {...props}
      style={{
        width: "100%",
        height: "100%",
        padding: 0,
        border: `2px solid ${
          hoveredSquare === name ? "rgba(255, 255, 255, .8)" : "transparent"
        }`,
        zIndex: promotionSquare === name ? 200 : 100,
        position: "relative",
      }}
      id={name}
      onContextMenu={(e) => e.preventDefault()}
      onClick={(e) => {
        if (e.button !== 2) {
          dispatch({type: "reset-arrows"})
          if (isGameOver) return
          if (!children && !canDrop) {
            dispatch({
              type: "set-selected-square",
              payload: {selectedSquare: null},
            })
          } else if (canDrop) {
            move({from: selectedSquare.square, to: name}, selectedSquare.piece)
          }
        }
      }}
      onMouseDown={(e) => {
        if (e.button === 2) {
          dispatch({type: "set-start-square", payload: {startSquare: name}})
        } else {
          dispatch({type: "reset-arrows"})
        }
      }}
      onMouseUp={(e) => {
        if (e.button === 2) {
          dispatch({type: "set-end-square", payload: {endSquare: name}})
        }
      }}
    >
      {children}
      {canDrop ? (
        <Box
          position="absolute"
          transform="translate(-50%, -50%)"
          top="50%"
          left="50%"
          background="rgba(0, 0, 0, 0.3)"
          width={{base: "10px", sm: "10px", md: "20px", lg: "20px"}}
          height={{base: "10px", sm: "10px", md: "20px", lg: "20px"}}
          borderRadius="50%"
        />
      ) : null}
      {isSquareHighlighted ? (
        <Box
          position="absolute"
          transform="translate(-50%, -50%)"
          top="50%"
          left="50%"
          width="100%"
          height="100%"
          border="3px solid #FF503599"
          borderRadius="50%"
          pointerEvents="none"
          zIndex={100}
        />
      ) : null}
      {showPromotionPopup ? (
        <PromotionPopup sourceSquare={sourceSquare} squareName={name} />
      ) : null}
    </Box>
  )
}

export default Square
