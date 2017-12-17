import React from 'react';
import ReactTable from 'react-table';
import Store from '../../store';
import TablePaginationRenderer from './pagination';
import { connect } from 'react-redux';
import {
  sortByDate,
  formatValue,
  secondsToString,
} from '../../util/util';
import config from '../../config';

const BOTTOM_BAR_DISPLAY_THRESHOLD = 15;

class Prices extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      prices: null,
      itemsList: [],
      filteredItemsList: [],
      itemsListColumns: this.generateItemsListColumns(),
      defaultPageSize: 100,
      pageSize: 100,
      showPagination: true,
    };
  }

  // https://react-table.js.org/#/custom-sorting
  tableSorting(a, b) { // ugly workaround, override default sort
    if (Date.parse(a)) { // convert date to timestamp
      a = Date.parse(a);
    }
    if (Date.parse(b)) {
      b = Date.parse(b);
    }
    // force null and undefined to the bottom
    a = (a === null || a === undefined) ? -Infinity : a;
    b = (b === null || b === undefined) ? -Infinity : b;
    // force any string values to lowercase
    a = typeof a === 'string' ? a.toLowerCase() : a;
    b = typeof b === 'string' ? b.toLowerCase() : b;
    // Return either 1 or -1 to indicate a sort priority
    if (a > b) {
      return 1;
    }
    if (a < b) {
      return -1;
    }
    // returning 0 or undefined will use any subsequent column sorting methods or the row index as a tiebreaker
    return 0;
  }

  renderPairIcon(pair) {
    const _pair = pair.split('/');

    return (
      <span>
        <img
          src={ `http://${config.ip}:${config.port}/public/images/${_pair[0].toLowerCase()}.png` }
          height="25px" />
        <span style={{ marginLeft: '10px' }}>{ _pair[0] }</span>
        <i
          style={{ marginLeft: '10px', marginRight: '10px' }}
          className="fa fa-exchange"></i>
        <img
          src={ `http://${config.ip}:${config.port}/public/images/${_pair[1].toLowerCase()}.png` }
          height="25px" />
        <span style={{ marginLeft: '10px' }}>{ _pair[1] }</span>
      </span>
    );
  }

  generateItemsListColumns(itemsCount) {
    let columns = [];
    let _col;

    _col = [{
      id: 'pair',
      Header: 'Pair',
      Footer: 'Pair',
      maxWidth: '250',
      accessor: (item) => this.renderPairIcon(item.pair),
    },
    { id: 'price',
      Header: 'Price',
      Footer: 'Price',
      maxWidth: '250',
      accessor: (item) => item.value,
    }];

    if (itemsCount <= BOTTOM_BAR_DISPLAY_THRESHOLD) {
      delete _col[0].Footer;
      delete _col[1].Footer;
    }

    columns.push(..._col);

    return columns;
  }

  componentWillReceiveProps(props) {
    const __prices = this.props.Main.prices;
    let _prices = [];

    for (let key in __prices) {
      _prices.push({
        pair: key,
        value: __prices[key],
      });
    }

    if (_prices &&
        _prices.length) {
      this.setState({
        prices: _prices,
        itemsList: _prices,
        filteredItemsList: this.filterData(_prices, this.state.searchTerm),
        showPagination: _prices && _prices.length >= this.state.defaultPageSize,
        itemsListColumns: this.generateItemsListColumns(_prices.length),
      });
    }
  }

  onPageSizeChange(pageSize, pageIndex) {
    this.setState(Object.assign({}, this.state, {
      pageSize: pageSize,
      showPagination: this.state.itemsList && this.state.itemsList.length >= this.state.defaultPageSize,
    }))
  }

  onSearchTermChange(newSearchTerm) {
    this.setState(Object.assign({}, this.state, {
      searchTerm: newSearchTerm,
      filteredItemsList: this.filterData(this.state.itemsList, newSearchTerm),
    }));
  }

  filterData(list, searchTerm) {
    return list.filter(item => this.filterDataByProp(item, searchTerm));
  }

  filterDataByProp(item, term) {
    if (!term) {
      return true;
    }

    return this.contains(item.pair.toLowerCase(), term);
  }

  contains(value, property) {
    return (value + '').indexOf(property) !== -1;
  }

  render() {
    if (this.state.prices &&
        this.state.prices.length) {
      return (
        <div
          style={{ maxWidth: '750px', margin: '0 auto' }}
          className="panel panel-default">
          <div className="panel-heading">
            <strong>Prices</strong>
          </div>
          <div className="prices-table">
            <input
              className="form-control search-field"
              onChange={ e => this.onSearchTermChange(e.target.value) }
              placeholder="Filter" />
            <ReactTable
              data={ this.state.filteredItemsList }
              columns={ this.state.itemsListColumns }
              minRows="0"
              sortable={ true }
              className="-striped -highlight"
              PaginationComponent={ TablePaginationRenderer }
              nextText="Next page"
              previousText="Previous page"
              showPaginationBottom={ this.state.showPagination }
              pageSize={ this.state.pageSize }
              defaultSortMethod={ this.tableSorting }
              defaultSorted={[{ // default sort
                id: 'pair',
                desc: true,
              }]}
              onPageSizeChange={ (pageSize, pageIndex) => this.onPageSizeChange(pageSize, pageIndex) } />
          </div>
        </div>
      );
    } else {
      return(<div>Loading...</div>);
    }
  }
}

const mapStateToProps = (state) => {
  return {
    Main: state.Main,
  };
};

export default connect(mapStateToProps)(Prices);