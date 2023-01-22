// TODO implement actual function to calculate scores based on rules
export function getPointsForComp(place: number, noContestants: number, holes: number) {
    return place * (noContestants / 10) * (holes / 18);
}