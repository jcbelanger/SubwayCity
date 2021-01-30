const svgNS = "http://www.w3.org/2000/svg";

const style = {
	station: {
		radius: 16,
		scaleX: 50,
		scaleY: 50,
		offsetX: 50,
		offsetY: 50
	},
	cars: {
	    verticalPadding: 6,
        horizontalPadding: 8,
		carGap: 8,
		carWidth: 30,
		carHeight: 27,
        wheelPadding: 5,
        wheelRadius: 8
	}
};

function parseData(subways) {
	const stations = new Map();
	for (const subway of subways) {
		for (const [x, y] of subway.stations) {
			if (stations.has(x)) {
				const xStations = stations.get(x);
				if (xStations.has(y)) {
					xStations.get(y).push(subway);
				} else {
					xStations.set(y, [subway]);
				}
			} else {
				const yStations = new Map();
				yStations.set(y, [subway]);
				stations.set(x, yStations);
			}
		}
	}

	return {
		subways,
		stations
	}
}

function createGame(svg, game) {

	for (const subway of game.subways) {
		const trackSVG = createTrack(subway);
		const carsSVG = createCars(subway);
		svg.appendChild(trackSVG);
		svg.appendChild(carsSVG);
	}


	for ([x, xStations] of game.stations) {
		for ([y, stations] of xStations) {
			const stationSVG = createStation(x, y);
			svg.appendChild(stationSVG);
		}
	}
}

function xySVG(x, y) {
	return [
		style.station.offsetX + style.station.scaleX * x,
		style.station.offsetY + style.station.scaleY * y
	];
}

function createStation(x, y) {
	const [stationX, stationY] = xySVG(x, y);
	const stationCircle = document.createElementNS(svgNS, "circle");
	stationCircle.classList.add("station");
	stationCircle.setAttribute("cx", stationX);
	stationCircle.setAttribute("cy", stationY);
	stationCircle.setAttribute("r", style.station.radius);
	return stationCircle;
}

function createTrack(subway) {
	const trackPoints = subway.stations
		.map(station => xySVG(...station).join(","))
		.join(" ");

	const points = trackStart(subway).join(",") + " " + trackPoints

	const trackPolyLine = document.createElementNS(svgNS, "polyline");
	trackPolyLine.classList.add("track");
	trackPolyLine.setAttribute("points", points);
	trackPolyLine.setAttribute("stroke", subway.color);
	return trackPolyLine;
}

function trackStart(subway) {
    const {x, y, width, height} = carsDim(subway);
    return [x + width / 2, y + height / 2];
}

function carsDim(subway) {
    const [x, y] = xySVG(...subway.cars);

	const {
		carGap,
		carWidth,
		carHeight,
	    verticalPadding,
        horizontalPadding,
	} = style.cars;

    const numGaps = Math.max(0, subway.size - 1);
    const width = subway.size * carWidth + 2 * horizontalPadding + numGaps * carGap;
    const height = carHeight + 2 * verticalPadding;

    return {
    	x,
    	y: y - height / 2,
    	width,
    	height
    }
}

function createCars(subway) {
    const {x, y, width, height} = carsDim(subway);

	const {
		carGap,
		carWidth,
		carHeight,
	    verticalPadding,
        horizontalPadding,
        wheelPadding,
        wheelRadius
	} = style.cars;

	const carsGroup = document.createElementNS(svgNS, "g");
	carsGroup.classList.add("cars");

    const carsShape = `
        M${x},${y}
		m${0},${verticalPadding}
		a${horizontalPadding},${verticalPadding} 0 0,1 ${horizontalPadding},${-verticalPadding}
		h${width - 2 * horizontalPadding}
		a${horizontalPadding},${verticalPadding} 0 0,1 ${horizontalPadding},${verticalPadding}
		v${height - verticalPadding}
		h${-width}
		v${verticalPadding - height}
	`;

	const carsPath = document.createElementNS(svgNS, "path");
	carsPath.classList.add("cars-shell");
	carsPath.setAttribute("d", carsShape);
	carsPath.setAttribute("fill", subway.color);
	carsGroup.appendChild(carsPath);

	for (let car = 0; car < subway.size; car++) {
		const carX = x + horizontalPadding + (carWidth + carGap) * car;
		const carY = y + verticalPadding;

		const carRect = document.createElementNS(svgNS, "rect");
	    carRect.classList.add("car");
		carRect.setAttribute("width", carWidth);
		carRect.setAttribute("height", carHeight);
		carRect.setAttribute("x", carX);
		carRect.setAttribute("y", carY);
		carsGroup.append(carRect);

	    const wheelsWidth = width - 2 * wheelPadding - 2 * wheelRadius;
	    const wheelDist = wheelsWidth / (subway.size - 1);
		const wheelX = x + wheelPadding + wheelRadius + wheelDist * car;
		const wheelY = y + height;

		const wheelCircle = document.createElementNS(svgNS, "circle");
	    wheelCircle.classList.add("wheel");
		wheelCircle.setAttribute("cx", wheelX);
		wheelCircle.setAttribute("cy", wheelY);
		wheelCircle.setAttribute("r", wheelRadius);
	    carsGroup.prepend(wheelCircle);
	}

	return carsGroup;
}


(async function main() {
	const response = await fetch('metro_city.json');
	const data = await response.json();
	const game = parseData(data);
	const svg = document.getElementById("game");
	createGame(svg, game);
})();