import { Component } from '@angular/core';
import { MatTableDataSource } from '@angular/material';

import { People, people  } from './sample-data';

export class Group {
  level: number = 0;
  parent: Group;
  expanded: boolean = true;
  get visible(): boolean {
    return !this.parent || (this.parent.visible && this.parent.expanded);
  }
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'Grid Grouping';



  displayedColumns: string[] = ['surname', 'forename', 'gender', 'ukCity', 'salary', 'department'];
  public dataSource = new MatTableDataSource<People | Group>([]);

  groupByColumns: string[] = ['department', 'salary'];

  columns: any[];
  constructor() {
    this.columns = [{
      field: 'surname',
    }, {
      field: 'forename',
    }, {
      field: 'gender',
    }, {
      field: 'ukCity',
    }, {
      field: 'salary',
    }, {
      field: 'department',
    }];

    this.dataSource.data = this.addGroups(people, this.groupByColumns);
    this.dataSource.filterPredicate = this.customFilterPredicate.bind(this);
  }

  customFilterPredicate(data: People | Group, filter: string): boolean {
    return (data instanceof Group) ? data.visible : this.getDataRowVisible(data);
  }

  getDataRowVisible(data: People): boolean {
    const groupRows = this.dataSource.data.filter(
      row => {
        if (!(row instanceof Group)) return false;

        let match = true;
        this.groupByColumns.forEach(
          column => {
            if (!row[column] || !data[column] || row[column] !== data[column]) match = false;
          }
        );
        return match;
      }
    );

    if (groupRows.length === 0) return true;
    if (groupRows.length > 1) throw "Data row is in more than one group!";
    const parent = <Group>groupRows[0];  // </Group> (Fix syntax coloring)

    return parent.visible && parent.expanded;
  }

  groupHeaderClick(row) {
    row.expanded = !row.expanded
    this.dataSource.filter = performance.now().toString();  // hack to trigger filter refresh
  }

  addGroups(data: any[], groupByColumns: string[]): any[] {
    var rootGroup = new Group();
    return this.getSublevel(data, 0, groupByColumns, rootGroup);
  }

  getSublevel(data: any[], level: number, groupByColumns: string[], parent: Group): any[] {
    // Recursive function, stop when there are no more levels.
    if (level >= groupByColumns.length)
      return data;

    var groups = this.uniqueBy(
      data.map(
        row => {
          var result = new Group();
          result.level = level + 1;
          result.parent = parent;
          for (var i = 0; i <= level; i++)
            result[groupByColumns[i]] = row[groupByColumns[i]];
          return result;
        }
      ),
      JSON.stringify);

    const currentColumn = groupByColumns[level];

    var subGroups = [];
    groups.forEach(group => {
      let rowsInGroup = data.filter(row => group[currentColumn] === row[currentColumn])
      let subGroup = this.getSublevel(rowsInGroup, level + 1, groupByColumns, group);
      subGroup.unshift(group);
      subGroups = subGroups.concat(subGroup);
    })
    return subGroups;
  }

  uniqueBy(a, key) {
    var seen = {};
    return a.filter(function (item) {
      var k = key(item);
      return seen.hasOwnProperty(k) ? false : (seen[k] = true);
    })
  }

  isGroup(index, item): boolean {
    return item.level;
  }
}
