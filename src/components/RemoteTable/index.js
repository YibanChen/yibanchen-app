import React, { Component } from 'react';
import PropTypes from 'prop-types';
import BootstrapTable from 'react-bootstrap-table-next';
import paginationFactory from 'react-bootstrap-table2-paginator';
import filterFactory, { Comparator } from 'react-bootstrap-table2-filter';

const pageButtonRenderer = ({ page, active, disabled, title, onPageChange }) => (
   <li className='page-item' key={`page-li-${title}`}>
      <button
         key={`page-button-${title}`}
         type='button'
         onClick={() => onPageChange(page)}
         className={`btn ${active ? 'btn-secondary' : 'btn-outline-light'}`}>
         {page}
      </button>
   </li>
);

const sizePerPageRenderer = ({ options, currSizePerPage, onSizePerPageChange }) => (
   <div className='btn-group' role='group'>
      {options.map(option => (
         <button
            key={option.text}
            type='button'
            onClick={() => onSizePerPageChange(option.page)}
            className={`btn ${currSizePerPage === `${option.page}` ? 'btn-secondary' : 'btn-outline-light'}`}>
            {option.text}
         </button>
      ))}
   </div>
);

const paginationTotalRenderer = (from, to, size) => (
   <span className='react-bootstrap-table-pagination-total'>
      {' '}
      Showing {from} to {to} of {size}
   </span>
);

const selectRow = {
   mode: 'checkbox',
   clickToSelect: false,
};

const defaultSorted = [
   {
      dataField: 'name',
      order: 'asc',
   },
];

const paginationOptions = {
   showTotal: true,
   withFirstAndLast: true,
   paginationTotalRenderer,
   sizePerPageRenderer,
   pageButtonRenderer,
   hidePageListOnlyOnePage: true,
};

const RemoteAll = ({
   data,
   page,
   sizePerPage,
   onTableChange,
   totalSize,
   columns,
   defaultSorted,
   disableSelectRow,
}) => (
   <div>
      <BootstrapTable
         bootstrap4
         remote
         keyField='id'
         data={data}
         columns={columns}
         defaultSorted={defaultSorted}
         filter={filterFactory()}
         pagination={paginationFactory({ ...paginationOptions, page, sizePerPage, totalSize })}
         onTableChange={onTableChange}
         selectRow={disableSelectRow ? undefined : selectRow}
      />
   </div>
);

RemoteAll.propTypes = {
   data: PropTypes.array.isRequired,
   page: PropTypes.number.isRequired,
   totalSize: PropTypes.number.isRequired,
   sizePerPage: PropTypes.number.isRequired,
   onTableChange: PropTypes.func.isRequired,
   columns: PropTypes.array.isRequired,
};

export default class RemoteTable extends Component {
   constructor(props) {
      super(props);
      this.state = {
         page: 1,
         data: props.data.slice(0, 10),
         totalSize: props.length,
         sizePerPage: 10,
         columns: props.columns,
      };
      this.handleTableChange = this.handleTableChange.bind(this);
   }
   componentWillReceiveProps({ data, length, columns }) {
      this.setState({
         page: 1,
         data: data.slice(0, 10),
         totalSize: length,
         sizePerPage: 10,
         columns: columns,
      });
   }

   handleTableChange = (type, { page, sizePerPage, filters, sortField, sortOrder }) => {
      const currentIndex = (page - 1) * sizePerPage;
      setTimeout(() => {
         console.log(type);
         let result = this.props.data;

         // Handle column filters
         result = result.filter(row => {
            let valid = true;
            for (const dataField in filters) {
               const { filterVal, filterType, comparator } = filters[dataField];

               if (filterType === 'TEXT') {
                  if (comparator === Comparator.LIKE) {
                     valid = row[dataField].toString().toLowerCase().indexOf(filterVal.toLowerCase()) > -1;
                  } else {
                     valid = row[dataField].toLowerCase() === filterVal.toLowerCase();
                  }
               }
               if (!valid) break;
            }
            return valid;
         });
         // Handle column sort
         if (sortOrder === 'asc') {
            result = result.sort((a, b) => {
               if (a[sortField] > b[sortField]) {
                  return 1;
               } else if (b[sortField] > a[sortField]) {
                  return -1;
               }
               return 0;
            });
         } else {
            result = result.sort((a, b) => {
               if (a[sortField] > b[sortField]) {
                  return -1;
               } else if (b[sortField] > a[sortField]) {
                  return 1;
               }
               return 0;
            });
         }
         this.setState(() => ({
            page,
            data: result.slice(currentIndex, currentIndex + sizePerPage),
            totalSize: this.props.length,
            sizePerPage,
         }));
      }, 100);
   };

   render() {
      const { data, sizePerPage, page, columns } = this.state;
      return (
         <RemoteAll
            data={data}
            page={page}
            sizePerPage={sizePerPage}
            totalSize={this.state.totalSize}
            onTableChange={this.handleTableChange}
            columns={columns}
            defaultSorted={this.props.sort || defaultSorted}
            disableSelectRow={!!this.props.disableSelectRow}
         />
      );
   }
}
