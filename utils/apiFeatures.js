class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'fields', 'sort', 'limit'];

    excludedFields.forEach((field) => {
      delete queryObj[field];
    });

    //FILTERING
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lt|lte)\b/g, (match) => `$${match}`);
    this.query.find(JSON.parse(queryStr));

    return this;
  }

  sort() {
    //SORTING ABILITY
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('createdAt');
    }

    return this;
  }

  limitFields() {
    // LIMITED FIELDS
    if (this.queryString.fields) {
      const fieldsLimited = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fieldsLimited);
    } else {
      this.query = this.query.select('-__v');
    }

    return this;
  }

  paginate() {
    // PAGINATION
    const limitPerPage = this.queryString.limit * 1 || 100;
    const page = this.queryString.page * 1 || 1;
    const skipResults = (page - 1) * limitPerPage;

    this.query = this.query.skip(skipResults).limit(limitPerPage);

    return this;
  }
}

module.exports = APIFeatures;
