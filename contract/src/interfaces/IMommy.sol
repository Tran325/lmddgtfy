pragma solidity >=0.5.0;
interface IMommy {
    function create(bytes memory code, uint saltLow, uint saltHigh) external payable;
    function killN(uint n) external;
}