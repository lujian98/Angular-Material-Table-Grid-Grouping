import { Component, OnInit, } from '@angular/core';
import { MatTableDataSource } from '@angular/material';

import { CarTableDataService } from './car-table-data.service';

export class Group {
  level = 0;
  parent: Group;
  expanded = false;
  totalCounts = 0;
  get visible(): boolean {
    return !this.parent || (this.parent.visible && this.parent.expanded);
  }
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'Grid Grouping';

  public dataSource = new MatTableDataSource<any | Group>([]);

  _alldata: any[];
  columns: any[];
  displayedColumns: string[];
  groupByColumns: string[] = [];

  constructor(
    protected dataSourceService: CarTableDataService,
  ) {

    this.columns = [{
      field: 'id'
    }, {
      field: 'vin'
    }, {
      field: 'brand'
    }, {
      field: 'year'
    }, {
      field: 'color'
    }];
    this.displayedColumns = this.columns.map(column => column.field);
    this.groupByColumns = ['brand'];
  }

  ngOnInit() {
    this.dataSourceService.getAllData()
    .subscribe(
      (data: any) => {
          data.data.forEach((item, index) => {
            item.id = index + 1;
          });
          this._alldata = data.data;
          this.dataSource.data = this.addGroups(this._alldata, this.groupByColumns);
          this.dataSource.filterPredicate = this.customFilterPredicate.bind(this);
          this.dataSource.filter = performance.now().toString();
        },
      (err: any) => console.log(err)
    );
  }

  groupBy(event, column) {
    event.stopPropagation();
    this.groupByColumns = [column.field];
    this.dataSource.data = this.addGroups(this._alldata, this.groupByColumns);
    this.dataSource.filter = performance.now().toString();
  }

  unGroupBy(event, column) {
    event.stopPropagation();
    this.groupByColumns = [];
    this.dataSource.data = this._alldata;
  }

  // below is for grid row grouping
  customFilterPredicate(data: any | Group, filter: string): boolean {
    return (data instanceof Group) ? data.visible : this.getDataRowVisible(data);
  }

  getDataRowVisible(data: any): boolean {
    const groupRows = this.dataSource.data.filter(
      row => {
        if (!(row instanceof Group)) {
          return false;
        }
        let match = true;
        this.groupByColumns.forEach(column => {
          if (!row[column] || !data[column] || row[column] !== data[column]) {
            match = false;
          }
        });
        return match;
      }
    );

    if (groupRows.length === 0) {
      return true;
    }
    const parent = groupRows[0] as Group;
    return parent.visible && parent.expanded;
  }

  groupHeaderClick(row) {
    row.expanded = !row.expanded;
    this.dataSource.filter = performance.now().toString();  // bug here need to fix
  }

  addGroups(data: any[], groupByColumns: string[]): any[] {
    const rootGroup = new Group();
    rootGroup.expanded = true;
    return this.getSublevel(data, 0, groupByColumns, rootGroup);
  }

  getSublevel(data: any[], level: number, groupByColumns: string[], parent: Group): any[] {
    if (level >= groupByColumns.length) {
      return data;
    }
    const groups = this.uniqueBy(
      data.map(
        row => {
          const result = new Group();
          result.level = level + 1;
          result.parent = parent;
          for (let i = 0; i <= level; i++) {
            result[groupByColumns[i]] = row[groupByColumns[i]];
          }
          return result;
        }
      ),
      JSON.stringify);

    const currentColumn = groupByColumns[level];
    let subGroups = [];
    groups.forEach(group => {
      const rowsInGroup = data.filter(row => group[currentColumn] === row[currentColumn]);
      group.totalCounts = rowsInGroup.length;
      const subGroup = this.getSublevel(rowsInGroup, level + 1, groupByColumns, group);
      subGroup.unshift(group);
      subGroups = subGroups.concat(subGroup);
    });
    return subGroups;
  }

  uniqueBy(a, key) {
    const seen = {};
    return a.filter((item) => {
      const k = key(item);
      return seen.hasOwnProperty(k) ? false : (seen[k] = true);
    });
  }

  isGroup(index, item): boolean {
    return item.level;
  }
}
