import { useEffect, useState } from "react";
import "./Game.css";

const Game = () => {
  const [position, setPosition] = useState({
    top: window.innerHeight / 2 - 25, // Start in the vertical center
    left: window.innerWidth / 2 - 25, // Start in the horizontal center
  });
  const [pressedKeys, setPressedKeys] = useState(new Set());
  const [fallingCubes, setFallingCubes] = useState<JSX.Element[]>([]);
  const [shotCubes, setShotCubes] = useState<JSX.Element[]>([]);
  const [lastScore, setLastScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [gameActive, setGameActive] = useState(false);
  const [shootingAllowed, setShootingAllowed] = useState(false);
  const movementStep = 10;
  const [fallingInterval, setFallingInterval] = useState(2000);

  // Handle key events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameActive) {
        if (e.key === "x") shootCube();
        setPressedKeys((prevKeys) => new Set(prevKeys).add(e.key));
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (gameActive) {
        setPressedKeys((prevKeys) => {
          const newKeys = new Set(prevKeys);
          newKeys.delete(e.key);
          return newKeys;
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [gameActive]);

  // Generate falling cubes
  useEffect(() => {
    let generateCubes: number | null = null;
    if (gameActive) {
      generateCubes = window.setInterval(() => {
        const randomLeft = Math.random() * 90;
        setFallingCubes((prevCubes) => [
          ...prevCubes,
          <div
            key={Math.random()}
            className="falling-cube"
            style={{ left: `${randomLeft}vw` }}
          />,
        ]);
      }, fallingInterval);

      return () => {
        if (generateCubes) window.clearInterval(generateCubes);
      };
    }
  }, [gameActive, fallingInterval]);

  // Check for collisions
  const checkCollision = (cube: Element, character: Element) => {
    const cubeRect = cube.getBoundingClientRect();
    const characterRect = character.getBoundingClientRect();
    return !(
      cubeRect.bottom < characterRect.top ||
      cubeRect.top > characterRect.bottom ||
      cubeRect.right < characterRect.left ||
      cubeRect.left > characterRect.right
    );
  };

  // Move character and check collisions
  useEffect(() => {
    const moveCharacter = () => {
      const character = document.querySelector(".player-character");
      const characterRect = character?.getBoundingClientRect() || {
        width: 50,
        height: 50,
      };
      const { width: characterWidth, height: characterHeight } = characterRect;
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      setPosition((prevPosition) => {
        let { top, left } = prevPosition;

        if (pressedKeys.has("ArrowUp")) top = Math.max(0, top - movementStep);
        if (pressedKeys.has("ArrowDown"))
          top = Math.min(windowHeight - characterHeight, top + movementStep);
        if (pressedKeys.has("ArrowLeft"))
          left = Math.max(0, left - movementStep);
        if (pressedKeys.has("ArrowRight"))
          left = Math.min(windowWidth - characterWidth, left + movementStep);

        return { top, left };
      });

      const cubes = document.querySelectorAll(".falling-cube");
      cubes.forEach((cube) => {
        if (character && checkCollision(cube, character)) endGame();
      });
    };

    if (gameActive) {
      const interval = window.setInterval(moveCharacter, 20);
      return () => window.clearInterval(interval);
    }
  }, [pressedKeys, gameActive]);

  const startGame = () => {
    setTimeLeft(0); // Start with 0 for infinite count
    setGameActive(true);
    setShootingAllowed(false);
    setFallingInterval(2000);
    setPosition({
      top: window.innerHeight / 2 - 25, // Re-center the character at the start of the game
      left: window.innerWidth / 2 - 25,
    });
  };

  // Handle falling cube increase
  useEffect(() => {
    let increaseFallingInterval: number | null = null;

    if (gameActive) {
      increaseFallingInterval = window.setInterval(() => {
        if (fallingInterval > 500) {
          setFallingInterval((prevInterval) => prevInterval - 500);
        }
      }, 10000);
    }

    return () => {
      if (increaseFallingInterval)
        window.clearInterval(increaseFallingInterval);
    };
  }, [gameActive, fallingInterval]);

  const shootCube = () => {
    if (shootingAllowed) {
      const newShotCube = (
        <div
          className="shot-cube"
          style={{
            position: "absolute",
            top: `${position.top}px`,
            left: `${position.left}px`,
            width: "10px",
            height: "10px",
            backgroundColor: "red",
            borderRadius: "50%",
          }}
        />
      );

      setShotCubes((prevShotCubes) => [...prevShotCubes, newShotCube]);

      // Animate the shot cube
      const shotCubeIndex = shotCubes.length; // Use the current length as the index
      const animateShotCube = () => {
        const cubeElements = document.querySelectorAll(".shot-cube");

        if (cubeElements[shotCubeIndex]) {
          const cubeElement = cubeElements[shotCubeIndex] as HTMLElement; // Cast to HTMLElement
          let shotInterval = window.setInterval(() => {
            const cubeRect = cubeElement.getBoundingClientRect();
            if (cubeRect.top <= 0) {
              clearInterval(shotInterval);
              setShotCubes((prev) =>
                prev.filter((_, index) => index !== shotCubeIndex)
              );
              return;
            }

            cubeElement.style.top = `${cubeRect.top - 5}px`; // Move the cube upwards
          }, 20);

          return () => clearInterval(shotInterval);
        }
      };

      animateShotCube();
    }
  };

  const endGame = () => {
    setGameActive(false);
    setLastScore(timeLeft); // Set last score to time played
    setFallingCubes([]);
    setPosition({
      top: window.innerHeight / 2 - 25, // Reset to center on game end
      left: window.innerWidth / 2 - 25,
    });
    setShootingAllowed(false);
    setShotCubes([]); // Clear shot cubes
  };

  // Timer for counting up infinitely
  useEffect(() => {
    let timer: number | null = null;
    if (gameActive) {
      timer = window.setInterval(() => {
        setTimeLeft((prevTime) => prevTime + 1);
      }, 1000);
    }

    return () => {
      if (timer) window.clearInterval(timer);
    };
  }, [gameActive]);

  return (
    <div className="game-container">
      {!gameActive && (
        <div className="controls-container">
          <div className="controls">
            <h1>Evade the falling cubes</h1>
            <button
              onClick={startGame}
              style={{ fontSize: "18px", padding: "5px" }}
            >
              Start Game
            </button>
            {lastScore > 0 && (
              <div className="last-score" style={{ marginTop: "10px" }}>
                Time Survived: {lastScore}s
              </div>
            )}
          </div>
        </div>
      )}

      <div
        className="counter"
        style={{
          position: "absolute",
          top: "10px",
          right: "10px",
          fontSize: "24px",
        }}
      >
        Time Elapsed: {timeLeft}s
      </div>

      {gameActive && (
        <div
          className="player-character"
          style={{
            position: "absolute",
            top: `${position.top}px`,
            left: `${position.left}px`,
          }}
        >
          <div className="character-head"></div>
          <div className="character-body"></div>
        </div>
      )}

      {fallingCubes}
      {shotCubes.map((cube, index) => (
        <div
          key={index}
          className="shot-cube"
          style={{
            position: "absolute",
            top: `${position.top}px`,
            left: `${position.left}px`,
          }}
        >
          {cube}
        </div>
      ))}
    </div>
  );
};

export default Game;
