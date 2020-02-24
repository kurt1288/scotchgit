class MapPosition {
    x: number;
    y: number;
    name: string;

    constructor(x: number, y: number, name: string) {
        this.x = x;
        this.y = y;
        this.name = name;
    }
}

class Whisky {
    private TotalRating: number;
    private TotalPrice: number;
    Name: string;
    ImageURL: string;
    Region: string;
    Position: MapPosition;
    PriceVRatingPosition: MapPosition;
    Reviews: Array<Review>;
    AveragePrice: number;
    AverageRating: number;
    
    constructor(name: string, image: string, region: string, position: MapPosition) {
        this.Name = name;
        this.ImageURL = image;
        this.Region = region;
        this.Position = position;
        this.Reviews = new Array<Review>();
        this.TotalPrice = 0;
        this.AveragePrice = 0;
        this.TotalRating = 0;
        this.AverageRating = 0;
        this.PriceVRatingPosition = new MapPosition(this.AveragePrice, this.AverageRating, this.Name);
    }

    AddReview(review: Review) {
        this.Reviews.push(review);
        this.UpdateRating(review.Rating);
        this.UpdatePrice(review.Price);
    }

    // rating is 'any' here because the incoming data isn't guaranteed to be a specific data type (unfortunately)
    private UpdateRating(rating:any) {
        if (isNaN(rating))
            return;

        this.TotalRating += rating;
        this.AverageRating = Math.round(this.TotalRating / this.Reviews.length);
        this.PriceVRatingPosition.y = this.AverageRating;
    }

    // price is 'any' here because the incoming data isn't guaranteed to be a specific data type (unfortunately)
    private UpdatePrice(price:any) {
        // Prices do not have a consistent format or denomination. Need to have some rules to exclude
        if (price === null || (price === null || (isNaN(price) && (price.match(/[a-z]/i) || price.match(/\(/) || price.indexOf("Â£") !== -1 || price.indexOf("~") !== -1))))
            return;
    
        if (isNaN(price))
            price = parseFloat(price.replace(/,/g,'.').replace(/[^\d\.]/g,''));

        this.TotalPrice += price;
        this.AveragePrice = Math.round(this.TotalPrice / this.Reviews.filter(x => x.Price !== null).length);
        this.PriceVRatingPosition.x = this.AveragePrice;
    }
}

class Review {
    Date: Date;
    ReviewLink: string;
    Price: string;
    Rating: number;
    Reviewer: string;

    constructor(date: Date, reviewLink: string, price: string, rating: number, reviewer: string) {
        this.Date = date;
        this.ReviewLink = reviewLink;
        this.Price = price;
        this.Rating = rating;
        this.Reviewer = reviewer;
    }
}

export { Whisky, Review, MapPosition };