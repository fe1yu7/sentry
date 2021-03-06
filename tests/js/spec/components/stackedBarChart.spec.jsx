import React from 'react';
import {shallow} from 'sentry-test/enzyme';

import StackedBarChart from 'app/components/stackedBarChart';

describe('StackedBarChart', function() {
  describe('render()', function() {
    it('renders with points data', function() {
      const points = [
        {x: 1439766000, y: [10]},
        {x: 1439769600, y: [20]},
        {x: 1439773200, y: [30]},
      ];

      const wrapper = shallow(<StackedBarChart points={points} />);
      const columns = wrapper.find('[data-test-id="chart-column"]');

      expect(columns).toHaveProperty('length', 3);
      expect(columns.at(0).text()).toEqual('10'); // check y values
      expect(columns.at(1).text()).toEqual('20');
      expect(columns.at(2).text()).toEqual('30');
    });

    it('renders with points and markers', function() {
      const points = [
        {x: 1439769600, y: [10]},
        {x: 1439773200, y: [20]},
        {x: 1439776800, y: [30]},
      ];
      const markers = [
        {x: 1439769600, className: 'first-seen', label: 'first seen'}, // matches first point
        {x: 1439776800, className: 'last-seen', label: 'last seen'}, // matches last point
      ];

      const wrapper = shallow(<StackedBarChart points={points} markers={markers} />);
      const columns = wrapper.find('[data-test-id="chart-column"]');

      expect(columns).toHaveProperty('length', 5);

      expect(columns.at(0).text()).toEqual('10');
      expect(columns.at(1).text()).toEqual('20');
      expect(columns.at(2).text()).toEqual('30');
      expect(columns.at(3).text()).toEqual('first seen');
      expect(columns.at(4).text()).toEqual('last seen');
    });

    it('renders with points and markers, when first and last seen are same data point', function() {
      const points = [{x: 1439776800, y: [30]}];
      const markers = [
        {x: 1439776800, className: 'first-seen', label: 'first seen'},
        {x: 1439776800, className: 'last-seen', label: 'last seen'},
      ];

      const wrapper = shallow(<StackedBarChart points={points} markers={markers} />);
      const columns = wrapper.find('[data-test-id="chart-column"]');

      expect(columns).toHaveProperty('length', 3);

      expect(columns.at(0).text()).toEqual('30');
      expect(columns.at(1).text()).toEqual('first seen');
      expect(columns.at(2).text()).toEqual('last seen');
    });
  });
});
