const svgNS = "http://www.w3.org/2000/svg";


class Game {
	constructor(subways, svg) {
	    this.style = {
			station: {
				radius: 16,
				scaleX: 50,
				scaleY: 50,
				offsetX: 250,
				offsetY: 30
			},
			cars: {
				verticalPadding: 4,
				horizontalPadding: 7,
				carGap: 7,
				carWidth: 27,
				carHeight: 27,
				wheelPadding: 5,
				wheelRadius: 8,
				wheelInsetRatio: 0.3
			},
			label: {
				radius: 20
			},
			points: {
				firstOffsetX: -5,
				firstOffsetY: -5,
				othersOffsetX: 8,
				othersOffsetY: 8,
				firstWidth: 25,
				firstHeight: 33,
				othersWidth: 18,
				othersHeight: 24,
			}
		};
        this.initData(subways);
		this.initSVG(svg);
	}

	initData(subways) {
		this.subways = subways;
		this.stationPosStationIdMap = new Map();
		this.stationIdStationPosMap = new Map();
		this.stationIdSubwayIdMap = new Map();
		this.subwayIdSubwayDataMap = new Map();
		this.stationOutEdgeMap = new Map();

		let nextStationId = 0;
		for (const subway of subways) {

			this.subwayIdSubwayDataMap.set(subway.label, subway);
			subway.stationIds = [];

			for (const [x, y] of subway.stations) {

				if (!this.stationPosStationIdMap.has(x)) {
				    this.stationPosStationIdMap.set(x, new Map());
				}

				const xMap = this.stationPosStationIdMap.get(x);
				if (!xMap.has(y)) {
					xMap.set(y, nextStationId);
				    this.stationIdStationPosMap.set(nextStationId, [x, y]);
					nextStationId++;
				}

				const stationId = xMap.get(y);
				subway.stationIds.push(stationId);
				
				if (!this.stationIdSubwayIdMap.has(stationId)) {
					this.stationIdSubwayIdMap.set(stationId, new Set());
				}

				const subwaySet = this.stationIdSubwayIdMap.get(stationId);
                subwaySet.add(subway.label);

			}

			for (let i = 0; i < subway.stationIds.length - 1; i++) {
				const srcStationId = subway.stationIds[i];
				const dstStationId = subway.stationIds[i + 1];
				
				if (!this.stationOutEdgeMap.has(srcStationId)) {
				    this.stationOutEdgeMap.set(srcStationId, new Map());
				}

                const srcOutEdges = this.stationOutEdgeMap.get(srcStationId);
                if (!srcOutEdges.has(dstStationId)) {
                	srcOutEdges.set(dstStationId, new Set());
                }

                const dstLabels = srcOutEdges.get(dstStationId);
                dstLabels.add(subway.label);
			}
		}
	}

	stationId(x, y) {
		return this.stationPosStationIdMap.get(x).get(y);
	}

	stationPos(stationId) {
		return this.stationIdStationPosMap.get(stationId);
	}

	stationSubwayIds(stationId) {
		return this.stationIdSubwayIdMap.get(stationId);
	}

	subwayData(subwayId) {
		return this.subwayIdSubwayDataMap.get(subwayId);
	}

	initSVG(svg) {
		for (const subway of this.subways) {
			const trackSVG = this.createTrack(subway);
			const carsSVG = this.createCars(subway);
			const labelSVG = this.createLabel(subway);
			const pointsSVG = this.createPoints(subway);
			svg.appendChild(trackSVG);
			svg.appendChild(carsSVG);
			svg.appendChild(labelSVG);
			svg.appendChild(pointsSVG);
		}

		for (const [id, [x, y]] of this.stationIdStationPosMap) {
			const stationSVG = this.createStation(x, y);
			svg.appendChild(stationSVG);
		}
	}

	xySVG(x, y) {
		const {
			offsetX,
			offsetY,
			scaleX,
			scaleY
		} = this.style.station;
		return [
		    offsetX + scaleX * x,
		    offsetY + scaleY * y
		];
	}

	createStation(x, y) {
		const [stationX, stationY] = this.xySVG(x, y);
		const stationId = this.stationId(x, y);
		const radius = this.style.station.radius;

		const stationCircle = document.createElementNS(svgNS, "circle");
		stationCircle.classList.add("station-circle");
		stationCircle.setAttribute("cx", stationX);
		stationCircle.setAttribute("cy", stationY);
		stationCircle.setAttribute("r", radius);

		const stationGroup = document.createElementNS(svgNS, "g");
		stationGroup.classList.add("station-group");
		stationGroup.setAttribute("id", `station-${stationId}`);
		stationGroup.appendChild(stationCircle);

		const endingSubways = this.subways.filter(subway => subway.stationIds[subway.stationIds.length - 1] == stationId);
        endingSubways.forEach((subway, ix) => {
        	const stationEndPath = document.createElementNS(svgNS, "path");
			stationEndPath.classList.add("station-end-path");
			stationGroup.appendChild(stationEndPath);
        });
        

		return stationGroup;
	}

	createLabel(subway) {
		const [carsX, carsY] = subway.cars;
		const [x, y] = this.xySVG(carsX - 2, carsY);

		const {radius} = this.style.label;

		const labelCircle = document.createElementNS(svgNS, "circle");
		labelCircle.classList.add("label-circle");
		labelCircle.setAttribute("r", radius);
		labelCircle.setAttribute("fill", subway.color);
		labelCircle.setAttribute("cx", x);
		labelCircle.setAttribute("cy", y);

		const label = document.createTextNode(subway.label);

		const labelText = document.createElementNS(svgNS, "text");
		labelText.classList.add("label-text");
		labelText.setAttribute("x", x);
		labelText.setAttribute("y", y);
		labelText.appendChild(label);

		const labelGroup = document.createElementNS(svgNS, "g");
		labelGroup.classList.add("label-group");
		labelGroup.appendChild(labelCircle);
		labelGroup.appendChild(labelText);

		return labelGroup;
	}


	createPoints(subway) {
		const [carsX, carsY] = subway.cars;
		const [x, y] = this.xySVG(carsX - 1, carsY);
		const [first, others] = subway.points;

		const {
			firstOffsetX,
			firstOffsetY,
			othersOffsetX,
			othersOffsetY,
			firstWidth,
			firstHeight,
			othersWidth,
			othersHeight
		} = this.style.points;

		const [firstX, firstY] = [x + firstOffsetX, y + firstOffsetY];
		const [othersX, othersY] = [x + othersOffsetX, y + othersOffsetY];

		const firstShape = `
			M${firstX},${firstY - firstHeight / 2}
			l${firstWidth / 2},${firstHeight / 2}
			l${-firstWidth / 2},${firstHeight / 2}
			l${-firstWidth / 2},${-firstHeight / 2}
			l${firstWidth / 2},${-firstHeight / 2}
		`;
		const firstPath = document.createElementNS(svgNS, "path");
		firstPath.classList.add("points-first-path");
		firstPath.setAttribute("d", firstShape);

		const firstTN = document.createTextNode(first);
		const firstText = document.createElementNS(svgNS, "text");
		firstText.classList.add("points-first-text");
		firstText.appendChild(firstTN);
		firstText.setAttribute("x", firstX);
		firstText.setAttribute("y", firstY);

		const firstPointsGroup = document.createElementNS(svgNS, "g");
		firstPointsGroup.classList.add("first-points-group");
		firstPointsGroup.appendChild(firstPath);
		firstPointsGroup.appendChild(firstText);

		const othersPointsRect = document.createElementNS(svgNS, "rect");
		othersPointsRect.classList.add("points-others-rect");
		othersPointsRect.setAttribute("x", othersX - othersWidth / 2);
		othersPointsRect.setAttribute("y", othersY - othersHeight / 2);
		othersPointsRect.setAttribute("width", othersWidth);
		othersPointsRect.setAttribute("height", othersHeight);

		const othersTN = document.createTextNode(others);
		const othersText = document.createElementNS(svgNS, "text");
		othersText.classList.add("points-others-text");
		othersText.appendChild(othersTN);
		othersText.setAttribute("x", othersX);
		othersText.setAttribute("y", othersY);

		const othersPointsGroup = document.createElementNS(svgNS, "g");
		othersPointsGroup.classList.add("others-points-group");
		othersPointsGroup.appendChild(othersPointsRect);
		othersPointsGroup.appendChild(othersText);

		const pointsGroup = document.createElementNS(svgNS, "g");
		pointsGroup.classList.add("points-group");
		pointsGroup.appendChild(othersPointsGroup);
		pointsGroup.appendChild(firstPointsGroup);

		return pointsGroup;
	}

	createTrack(subway) {
		const stationSubways = subway.stationIds.map(x => this.stationSubwayIds(x));
        
        const points = [ 
            this.trackStart(subway),
            this.xySVG(...subway.stations[0])
		];

		const lastIx = subway.stationIds.length - 1;
        for (let i = 0; i < lastIx; i++) {
            const [prevIx, nextIx] = [i, i + 1];


        	const prevStationId = subway.stationIds[prevIx];
        	const nextStationId = subway.stationIds[nextIx];

        	const prevSubways = this.stationSubwayIds(prevStationId);
        	const nextSubways = this.stationSubwayIds(nextStationId);

            const outEdges = this.stationOutEdgeMap.get(prevStationId).get(nextStationId);

            let inEdges = [];
            if (this.stationOutEdgeMap.has(nextStationId)) {
            	const nextOutEdges = this.stationOutEdgeMap.get(nextStationId);
            	if (nextOutEdges.has(prevStationId)) {
            		inEdges = nextOutEdges.get(prevStationId);
            	}
            }

            const trackOverlaps = [...inEdges, ...outEdges];

        	// Must sort to guarantee the direction does not flip the offset calculation.
            const edgeDirection = Math.sign(nextStationId - prevStationId);
        	const edgeIx = trackOverlaps
				.sort((a, b) => edgeDirection * a.localeCompare(b))
				.indexOf(subway.label);

            const [prevX, prevY] = this.xySVG(...subway.stations[prevIx]);
            const [nextX, nextY] = this.xySVG(...subway.stations[nextIx]);


        	// We offset tracks with the same start and end station to prevent overlap.
        	// Offset occurs along the perpinduclar axis to the track's edge.
            const rise = prevY - nextY;
            const run = prevX - nextX;
            
            let perpRise, perpRun;
            if (rise == 0 || run == 0) {
                perpRise = run;
                perpRun = rise;
            } else {
            	perpRise = -run;
            	perpRun = rise;
            }

			const perpDist = Math.sqrt(rise * rise + run * run);
			perpRun /= perpDist;
			perpRise /= perpDist;

            const trackStrokeWidth = 9;
            const secondaryAxislength = 2 * this.style.station.radius;
            const edgeLength = secondaryAxislength / trackOverlaps.length;

            const firstEdgeNextX = nextX - perpRun  * secondaryAxislength / 2;
            const firstEdgeNextY = nextY - perpRise * secondaryAxislength / 2;
            const firstEdgePrevX = prevX - perpRun  * secondaryAxislength / 2;
            const firstEdgePrevY = prevY - perpRise * secondaryAxislength / 2;

            const edgeNextX = firstEdgeNextX + perpRun  * (edgeIx + 0.5) * edgeLength;
            const edgeNextY = firstEdgeNextY + perpRise * (edgeIx + 0.5) * edgeLength;
            const edgePrevX = firstEdgePrevX + perpRun  * (edgeIx + 0.5) * edgeLength;
            const edgePrevY = firstEdgePrevY + perpRise * (edgeIx + 0.5) * edgeLength;

            points.push([edgePrevX, edgePrevY]);
            points.push([edgeNextX, edgeNextY]);

            if (nextIx == lastIx && trackOverlaps.length > 1) {
            	points.push([nextX, nextY]);
            }
        }
		
		const trackPoints = points
			.map(x => x.join(","))
			.join(" ");

		const trackPolyLine = document.createElementNS(svgNS, "polyline");
		trackPolyLine.classList.add("track-polyline");
		trackPolyLine.setAttribute("points", points);
		trackPolyLine.setAttribute("stroke", subway.color);
		return trackPolyLine;
	}

	trackStart(subway) {
		const {
			x,
			y,
			width,
			height
		} = this.carsDim(subway);

		return [
		    x + width / 2,
		    y + height / 2
		];
	}

	carsDim(subway) {
		const [x, y] = this.xySVG(...subway.cars);

		const {
			carGap,
			carWidth,
			carHeight,
			verticalPadding,
			horizontalPadding,
		} = this.style.cars;

		const numGaps = Math.max(0, subway.size - 1);
		const width = subway.size * carWidth + 2 * horizontalPadding + numGaps * carGap;
		const height = carHeight + 2 * verticalPadding;

		return {
			x: x - carWidth / 2,
			y: y - height / 2,
			width,
			height
		}
	}

	createCars(subway) {
		const {x, y, width, height} = this.carsDim(subway);

		const {
			carGap,
			carWidth,
			carHeight,
			verticalPadding,
			horizontalPadding,
			wheelPadding,
			wheelRadius,
			wheelInsetRatio
		} = this.style.cars;

		const carsGroup = document.createElementNS(svgNS, "g");
		carsGroup.classList.add("cars-group");

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
		carsPath.classList.add("cars-path");
		carsPath.setAttribute("d", carsShape);
		carsPath.setAttribute("fill", subway.color);
		carsGroup.appendChild(carsPath);

		for (let car = 0; car < subway.size; car++) {
			const carX = x + horizontalPadding + (carWidth + carGap) * car;
			const carY = y + verticalPadding;

			const carRect = document.createElementNS(svgNS, "rect");
			carRect.classList.add("car-rect");
			carRect.setAttribute("width", carWidth);
			carRect.setAttribute("height", carHeight);
			carRect.setAttribute("x", carX);
			carRect.setAttribute("y", carY);
			carsGroup.append(carRect);

			const wheelsWidth = width - 2 * wheelPadding - 2 * wheelRadius;
			const wheelDist = wheelsWidth / (subway.size - 1);
			const wheelX = x + wheelPadding + wheelRadius + wheelDist * car;
			const wheelY = y + height - wheelInsetRatio * wheelRadius;

			const wheelCircle = document.createElementNS(svgNS, "circle");
			wheelCircle.classList.add("wheel-circle");
			wheelCircle.setAttribute("cx", wheelX);
			wheelCircle.setAttribute("cy", wheelY);
			wheelCircle.setAttribute("r", wheelRadius);
			carsGroup.prepend(wheelCircle);
		}

		return carsGroup;
	}

}


(async function main() {
	const response = await fetch('metro_city.json');
	const subways = await response.json();
	const svg = document.getElementById("game");
	const game = new Game(subways, svg);
})();