// 'use strict';

// const socket = require('../socket');
// const { getRooms } = require('../player');

// jest.mock('../socket.js', () => {
//   return{
//     on: jest.fn(),
//     emit: jest.fn(),
//   };
// });

// describe('handle player', () => {
//   it('gets rooms', () => {
//     getRooms();
//     expect(socket.emit).toHaveBeenCalledWith('GET_OPEN_ROOMS');
//     expect(socket.on).toHaveBeenCalledWith('RECEIVE_ROOM_NAMES');
//   });
// });