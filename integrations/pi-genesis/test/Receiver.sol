// SPDX-License-Identifier: MIT
pragma solidity 0.8.37;

contract ReentrantReceiver {
    address public target;
    bytes private _nested;
    bool public attempted;
    bool public blocked;

    function execute(address target_, bytes calldata outer, bytes calldata nested) external {
        target = target_;
        _nested = nested;
        (bool ok,) = target_.call(outer);
        require(ok, "Outer mint must succeed");
    }

    function onERC721Received(address, address, uint256, bytes calldata) external returns (bytes4) {
        require(msg.sender == target);
        attempted = true;
        (bool ok,) = target.call(_nested);
        blocked = !ok;
        return this.onERC721Received.selector;
    }
}
