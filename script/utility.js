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
	const multiplicationTable = new Array(10)
		.fill(0)
		.map((_, i) => i + 1)
		.map((i) => {
			const seconds = new Array(10 - i + 1).fill(0).map((_, ii) => {
				return 10 - ii;
			});
			return [
				...seconds.map((ii) => {
					return [i, ii];
				}),
				...seconds.map((ii) => [ii, i]),
			];
		});
	const WEEK_NUMBER = 2;
	const defaultNotes = multiplicationTable
		.slice(0, WEEK_NUMBER)
		.reduce((acc, currentRow) => {
			return [
				...acc,
				...currentRow.map(([first, second]) => {
					return new Card({
						front: { type: "text", value: `${first} x ${second}` },
						back: { type: "text", value: `${first * second}` },
						slug: `${first}x${second}`,
					});
				}),
			];
		}, []);
	console.log({ defaultNotes });
	// const defaultCards = defaultNotes.reduce((cards, note) => {
	// 	return [...cards, ...note.generateCards()];
	// }, []);
	const defaultCards = defaultNotes;
	let toReturn = [];
	try {
		const parsedLoadedCards = loadedCards
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
			: [];
		// now merge these with any default cards
		toReturn = [
			...parsedLoadedCards,
			...defaultCards.filter(
				(card) =>
					!parsedLoadedCards.some(
						(parsedCard) => parsedCard.slug === card.slug
					)
			),
		];
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
