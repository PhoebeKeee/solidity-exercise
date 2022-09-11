// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

contract TodoList {
    struct Todo {
        string text;
        bool completed;
    }

    Todo[] public todos;

    function create(string calldata _text) external {
        todos.push(Todo({
            text: _text,
            completed: false
        }));
    }

    function updateText(uint _index, string calldata _text) external {
        todos[_index].text = _text;
        Todo storage todo = todos[_index];
        todo.text = _text;
        // compare with todos[_index].text = _text, the upper solution spends less gas.
    }

    function get(uint _index) external view returns (string memory, bool) {
        Todo memory todo = todos[_index];
        return (todo.text, todo.completed);
    }

    function toggleCompleted(uint _index) external {
        todos[_index].completed = !todos[_index].completed;
    }

}
