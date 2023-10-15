const MILLISECONDS_PER_DAY = 1000 * 60 * 60 * 24;
export class Card {
	dailyForgetting = 0.1; // how much is forgotten each day?

	constructor({ front, back, slug, results }) {
		this.front = front;
		this.back = back;
		this.slug = slug;
		this.results = results ? results : [];
	}

	getSuccesses() {
		return this.results.filter((x) => !!x.result).length;
	}
	getFailures() {
		return this.results.filter((x) => !x.result).length;
	}
	getWeightedSuccesses() {
		console.log("Calculating weighted successes");
		const now = new Date();
		let successes = 0;
		this.results.forEach((result) => {
			if (result.result === true) {
				const then = new Date(result.date);
				const differenceInDays = Math.floor(
					(now.getTime() - then.getTime()) / MILLISECONDS_PER_DAY
				);
				const weightedAmount =
					(1 - this.dailyForgetting) ** differenceInDays;
				console.log({ result, differenceInDays, weightedAmount });
				successes += weightedAmount;
			}
		});
		return successes;
	}
	getWeightedFailures() {
		console.log("Calculating weighted failures");
		const now = new Date();
		let successes = 0;
		this.results.forEach((result) => {
			if (result.result === false) {
				const then = new Date(result.date);
				const differenceInDays = Math.floor(
					(now.getTime() - then.getTime()) / MILLISECONDS_PER_DAY
				);
				const weightedAmount =
					(1 - this.dailyForgetting) ** differenceInDays;
				console.log({ result, differenceInDays, weightedAmount });
				successes += weightedAmount;
			}
		});
		return successes;
	}
	getSample() {
		return jStat.beta.sample(
			this.getWeightedSuccesses() + 1,
			this.getWeightedFailures() + 1
		);
	}
	pdf(x) {
		return jStat.beta.pdf(
			x,
			this.getWeightedSuccesses() + 1,
			this.getWeightedFailures() + 1
		);
	}
	toJson() {
		return {
			front: this.front,
			back: this.back,
			slug: this.slug,
			results: this.results,
		};
	}
	/**
	 * Generate the identifier (name) for this card on the results page
	 */
	generateResultsIdentifier() {
		return `${
			this.front.type === "audio"
				? `${this.back.value} (audio)`
				: `${this.front.value} (text)`
		} &rarr; ${
			this.back.type === "audio"
				? `${this.front.value} (audio)`
				: `${this.back.value} (text)`
		}`;
	}
}

/**
 * A single result from a card, storing the date and whether it was good or bad
 */
export class Result {
	constructor(input) {
		// because it might be in the old format
		console.log("In Result constructor with", input);
		if (typeof input === "boolean") {
			this.result = input;
			this.date = Date();
		} else {
			const { result, date } = input;
			this.result = result;
			this.date = date;
		}
	}
}

export const loadCards = () => {
	const loadedCards = localStorage.getItem("cards");
	const defaultCards = [
		new Card({
			front: { value: "the", type: "text" },
			back: { value: "./media/the.m4a", type: "audio" },
			slug: "the (text)",
		}),
		new Card({
			front: { value: "./media/the.m4a", type: "audio" },
			back: { value: "the", type: "text" },
			slug: "the (audio)",
		}),
		new Card({
			front: { value: "cat", type: "text" },
			back: { value: "./media/cat.m4a", type: "audio" },
			slug: "cat (text)",
		}),
		new Card({
			back: { value: "cat", type: "text" },
			front: { value: "./media/cat.m4a", type: "audio" },
			slug: "cat (audio)",
		}),
	];
	let toReturn = [];
	try {
		toReturn = loadedCards
			? JSON.parse(loadedCards).map(
					(data) =>
						new Card({
							...data,
							results: data.results
								? data.results.map(
										(result) => new Result(result)
								  )
								: [],
						})
			  )
			: defaultCards;
		console.log({ toReturn });
	} catch (e) {
		console.error(`Error parsing data from local storage:`, e);
		console.log({ loadedCards });
	}
	return toReturn;
};
export const saveCards = (cards) => {
	console.log("in saveCards with", cards);
	localStorage.setItem(
		"cards",
		JSON.stringify(
			cards.map((card) => card.toJson()),
			null,
			4
		)
	);
};
